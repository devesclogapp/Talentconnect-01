import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <span className={className} style={{ display: 'inline-flex' }}>
        <FaWhatsapp size={size} color="#25D366" />
    </span>
);
