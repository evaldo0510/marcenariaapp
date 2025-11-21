
import React, { useState, useEffect } from 'react';
import { CurrencyDollarIcon, CalculatorIcon } from './Shared';

export const PricingCalculator: React.FC = () => {
    const [values, setValues] = useState({
        materialCost: 0,
        hours: 0,
        hourlyRate: 50,
        otherCosts: 0,
        marginPercent: 30
    });

    const [results, setResults] = useState({
        laborCost: 0,
        totalCost: 0,
        profit: 0,
        finalPrice: 0
    });

    useEffect(() => {
        const laborCost = values.hours * values.hourlyRate;
        const totalCost = values.materialCost + laborCost + values.otherCosts;
        const profit = totalCost * (values.marginPercent / 100);
        const finalPrice = totalCost + profit;

        setResults({ laborCost, totalCost, profit, finalPrice });
    }, [values]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#b99256] dark:text-[#d4ac6e]">
                    <CalculatorIcon /> Calculadora de Preço de Venda
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">Custos Diretos</h3>
                        <div>
                            <label className="block text-sm mb-1">Custo de Materiais (R$)</label>
                            <input type="number" name="materialCost" value={values.materialCost} onChange={handleChange} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" />
                        </div>
                         <div>
                            <label className="block text-sm mb-1">Custos Extras / Frete (R$)</label>
                            <input type="number" name="otherCosts" value={values.otherCosts} onChange={handleChange} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" />
                        </div>

                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mt-6">Mão de Obra</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1">Horas Estimadas</label>
                                <input type="number" name="hours" value={values.hours} onChange={handleChange} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Valor/Hora (R$)</label>
                                <input type="number" name="hourlyRate" value={values.hourlyRate} onChange={handleChange} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" />
                            </div>
                        </div>

                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mt-6">Lucro</h3>
                        <div>
                            <label className="block text-sm mb-1">Margem de Lucro Desejada (%)</label>
                            <input type="number" name="marginPercent" value={values.marginPercent} onChange={handleChange} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" />
                        </div>
                    </div>

                    <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-6 rounded-xl flex flex-col justify-center space-y-6">
                        <div className="flex justify-between text-sm">
                            <span>Total Materiais + Extras:</span>
                            <span className="font-bold">R$ {(values.materialCost + values.otherCosts).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total Mão de Obra:</span>
                            <span className="font-bold">R$ {results.laborCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-300 dark:border-gray-600">
                            <span>Custo Total de Produção:</span>
                            <span>R$ {results.totalCost.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-green-600 dark:text-green-400 font-bold pt-2">
                            <span>Lucro Estimado:</span>
                            <span>R$ {results.profit.toFixed(2)}</span>
                        </div>

                        <div className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] p-6 rounded-lg text-center mt-4 shadow-lg transform scale-105">
                            <p className="text-sm uppercase tracking-widest opacity-80 mb-1">Preço Final Sugerido</p>
                            <p className="text-4xl font-bold">R$ {results.finalPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
