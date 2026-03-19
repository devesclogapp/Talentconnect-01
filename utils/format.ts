
/**
 * Formata um número para o padrão de moeda brasileiro (BRL)
 * @param value Valor a ser formatado
 * @returns String formatada (ex: R$ 1.250,00)
 */
export const formatCurrency = (value: number | string | undefined | null): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (num === undefined || num === null || isNaN(num)) {
        return 'R$ 0,00';
    }

    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
};

/**
 * Formata um número para string com 2 casas decimais e vírgula
 * @param value Valor numérico
 */
export const formatNumber = (value: number | string | undefined | null): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (num === undefined || num === null || isNaN(num)) {
        return '0,00';
    }

    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};
