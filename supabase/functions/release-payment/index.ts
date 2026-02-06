import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReleasePaymentRequest {
    orderId: string;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        const { orderId }: ReleasePaymentRequest = await req.json();

        // Get order and execution details
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*, executions(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            throw new Error('Order not found');
        }

        const execution = order.executions[0];

        // Validate both parties confirmed completion
        if (!execution.provider_confirmed_finish || !execution.client_confirmed_finish) {
            throw new Error('Both parties must confirm completion before payment release');
        }

        // Get payment
        const { data: payment, error: paymentError } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (paymentError || !payment) {
            throw new Error('Payment not found');
        }

        if (payment.escrow_status !== 'held') {
            throw new Error('Payment is not in escrow');
        }

        // Release payment
        const { error: updateError } = await supabaseClient
            .from('payments')
            .update({ escrow_status: 'released' })
            .eq('id', payment.id);

        if (updateError) {
            throw updateError;
        }

        // Update order status
        await supabaseClient
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', orderId);

        // Update provider stats
        await supabaseClient.rpc('increment_provider_services', {
            provider_user_id: order.provider_id,
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Payment released successfully',
                amount: payment.provider_amount,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
