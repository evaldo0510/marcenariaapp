import React, { useState } from 'react';
import { DistributorFinder } from './DistributorFinder';

export const PartnerNetwork = () => {
    const [isOpen, setIsOpen] = useState(true);
    return <DistributorFinder isOpen={isOpen} onClose={() => setIsOpen(false)} showAlert={(msg) => alert(msg)} />;
}