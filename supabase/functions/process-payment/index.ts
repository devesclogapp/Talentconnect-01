import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
    orderId: string;
    paymentMethod: string;
    amount: number;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        // Get user from JWT
        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error('Unauthorized');
        }

        const { orderId, paymentMethod, amount }: PaymentRequest = await req.json();

        // Validate order belongs to user
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('client_id', user.id)
            .single();

        if (orderError || !order) {
            throw new Error('Order not found or unauthorized');
        }

        // Check if order is in correct status
        if (order.status !== 'awaiting_payment' && order.status !== 'accepted') {
            throw new Error('Order is not ready for payment');
        }

        // Calculate fees (10% operator fee)
        const operatorFee = amount * 0.10;
        const providerAmount = amount - operatorFee;

        // Create payment record
        const { data: payment, error: paymentError } = await supabaseClient
            .from('payments')
            .insert({
                order_id: orderId,
                amount_total: amount,
                operator_fee: operatorFee,
                provider_amount: providerAmount,
                escrow_status: 'held',
                payment_method: paymentMethod,
                transaction_id: `txn_${Date.now()}_${orderId.substring(0, 8)}`,
            })
            .select()
            .single();

        if (paymentError) {
            throw paymentError;
        }

        // Update order status
        await supabaseClient
            .from('orders')
            .update({ status: 'paid_escrow_held' })
            .eq('id', orderId);

        // Create execution record
        await supabaseClient
            .from('executions')
            .insert({
                order_id: orderId,
            });

        return new Response(
            JSON.stringify({
                success: true,
                payment,
                message: 'Payment processed successfully',
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
