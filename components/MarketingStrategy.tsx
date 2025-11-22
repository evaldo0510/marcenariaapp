
import React, { useState } from 'react';
import { 
    CheckIcon, 
    FacebookIcon, 
    InstagramIcon, 
    LinkedinIcon, 
    EmailIcon, 
    CopyIcon, 
    ChartBarIcon,
    RocketIcon,
    TargetIcon
} from './Shared';

export const MarketingStrategy: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'plan' | 'emails' | 'social' | 'lp' | 'roi'>('plan');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    // ROI Calculator State
    const [roiLeads, setRoiLeads] = useState(50);
    const [roiConversion, setRoiConversion] = useState(10);
    const [roiTicket, setRoiTicket] = useState(49.90);
    
    const projectedClients = Math.floor(roiLeads * (roiConversion / 100));
    const projectedRevenue = projectedClients * roiTicket;
    const partnerShare = projectedRevenue * 0.15; // Assuming 15% commission

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback("Copiado!");
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'plan':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-[#fffefb] dark:bg-[#3e3535] p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                            <h2 className="text-2xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4 flex items-center gap-2">
                                <RocketIcon className="w-6 h-6" /> Plano de Lançamento do Parceiro
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Siga este cronograma de 4 semanas para estabelecer sua autoridade e começar a vender o MarcenApp na sua região.
                            </p>
                            
                            <div className="relative border-l-2 border-[#d4ac6e] ml-4 space-y-8">
                                <div className="ml-6 relative">
                                    <span className="absolute -left-[33px] top-0 bg-[#d4ac6e] w-4 h-4 rounded-full"></span>
                                    <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Semana 1: Preparação e Anúncio</h3>
                                    <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                                        <li>Obtenha sua certificação no Portal.</li>
                                        <li>Personalize seus materiais de marketing com seu logo.</li>
                                        <li>Faça um post de "Teaser" nas redes sociais ("Vem aí uma novidade para marceneiros...").</li>
                                        <li>Crie uma lista VIP de 10 marcenarias próximas para visitar.</li>
                                    </ul>
                                </div>
                                <div className="ml-6 relative">
                                    <span className="absolute -left-[33px] top-0 bg-[#d4ac6e] w-4 h-4 rounded-full"></span>
                                    <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Semana 2: Prospecção Ativa</h3>
                                    <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                                        <li>Visite as 5 primeiras marcenarias da lista VIP.</li>
                                        <li>Envie a sequência de e-mails de "Apresentação" para contatos frios.</li>
                                        <li>Publique o vídeo de demonstração no Instagram/Facebook.</li>
                                    </ul>
                                </div>
                                <div className="ml-6 relative">
                                    <span className="absolute -left-[33px] top-0 bg-[#d4ac6e] w-4 h-4 rounded-full"></span>
                                    <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Semana 3: Conversão e Demonstração</h3>
                                    <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                                        <li>Agende calls ou visitas de retorno para quem demonstrou interesse.</li>
                                        <li>Realize demonstrações ao vivo focando no "Plano de Corte" (maior dor).</li>
                                        <li>Ofereça o cupom de desconto de primeira assinatura.</li>
                                    </ul>
                                </div>
                                <div className="ml-6 relative">
                                    <span className="absolute -left-[33px] top-0 bg-[#d4ac6e] w-4 h-4 rounded-full"></span>
                                    <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Semana 4: Follow-up e Expansão</h3>
                                    <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                                        <li>Faça o onboarding dos primeiros clientes ativos.</li>
                                        <li>Peça depoimentos/fotos dos primeiros clientes usando o app.</li>
                                        <li>Amplie a prospecção para cidades vizinhas.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'emails':
                return (
                    <div className="space-y-6 animate-fadeIn">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    title: "E-mail 1: Abordagem Fria (Foco em Dor)",
                                    subject: "Reduza o desperdício de chapas na sua marcenaria",
                                    body: "Olá [Nome],\n\nVi alguns trabalhos da sua marcenaria e achei a qualidade excelente. Parabéns!\n\nSei que um dos maiores gargalos hoje é o tempo perdido fazendo orçamentos e o desperdício de material no corte. Estou representando uma nova tecnologia, o MarcenApp, que resolve isso em minutos usando Inteligência Artificial.\n\nGostaria de te dar 7 dias de acesso grátis para você testar o nosso otimizador de corte. O que acha?\n\nAbraço,\n[Seu Nome]"
                                },
                                {
                                    title: "E-mail 2: Follow-up (Prova Social)",
                                    subject: "Veja este projeto feito em 5 minutos",
                                    body: "Oi [Nome],\n\nSó para ilustrar o que comentei anteriormente: o projeto em anexo (PDF) foi gerado inteiramente pelo MarcenApp em menos de 10 minutos, incluindo a lista de compras pronta para enviar ao fornecedor.\n\nImagine quanto tempo sua equipe economizaria tendo isso na mão?\n\nPodemos agendar uma visita rápida de 15 min para eu te mostrar na prática?\n\nAtenciosamente,\n[Seu Nome]"
                                }
                            ].map((template, i) => (
                                <div key={i} className="bg-white dark:bg-[#3e3535] p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm relative group">
                                    <h3 className="font-bold text-[#b99256] dark:text-[#d4ac6e] mb-3">{template.title}</h3>
                                    <div className="bg-gray-50 dark:bg-[#2d2424] p-3 rounded mb-2 text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-bold">Assunto:</span> {template.subject}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#2d2424] p-3 rounded text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400 h-48 overflow-y-auto">
                                        {template.body}
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(template.subject + "\n\n" + template.body)}
                                        className="absolute top-4 right-4 p-2 bg-[#e6ddcd] dark:bg-[#4a4040] rounded-full text-gray-600 dark:text-gray-300 hover:bg-[#d4ac6e] hover:text-white transition"
                                        title="Copiar Texto"
                                    >
                                        {copyFeedback ? <CheckIcon className="w-4 h-4" /> : <CopyIcon />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'social':
                return (
                    <div className="animate-fadeIn space-y-8">
                        <div className="bg-[#fffefb] dark:bg-[#3e3535] p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                            <h3 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4">Kit de Mídia Social</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Use estas legendas e ideias de criativos para atrair leads no Instagram, Facebook e LinkedIn.
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-[#2d2424] p-4 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-3 text-blue-600">
                                        <LinkedinIcon /> <span className="font-bold text-sm">LinkedIn / Profissional</span>
                                    </div>
                                    <div className="aspect-square bg-gray-200 dark:bg-gray-800 mb-3 rounded flex items-center justify-center text-xs text-gray-500">
                                        [Imagem: Marceneiro usando Tablet]
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        "A marcenaria tradicional encontrou a inteligência artificial. 🪵🤖<br/><br/>
                                        Orgulho em anunciar que agora sou parceiro oficial do @MarcenApp. Ajudamos marcenarias a reduzir em até 40% o desperdício de material e automatizar orçamentos.<br/><br/>
                                        Marceneiros da minha rede: vamos modernizar sua produção? Me chamem para um teste grátis.<br/><br/>
                                        #Marcenaria #Inovação #MarcenApp #MóveisPlanejados"
                                    </p>
                                    <button onClick={() => handleCopy("...")} className="w-full py-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold">Copiar Legenda</button>
                                </div>

                                <div className="bg-white dark:bg-[#2d2424] p-4 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-3 text-pink-600">
                                        <InstagramIcon /> <span className="font-bold text-sm">Instagram / Visual</span>
                                    </div>
                                    <div className="aspect-square bg-gray-200 dark:bg-gray-800 mb-3 rounded flex items-center justify-center text-xs text-gray-500">
                                        [Carrossel: Antes (Rascunho Papel) vs Depois (Render 3D)]
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        "Do papel para o 3D em minutos! 🚀<br/><br/>
                                        Cansado de perder vendas porque o cliente não 'visualizou' o projeto? Com o MarcenApp, você entrega esse nível de realismo na hora.<br/><br/>
                                        ✅ Orçamento automático<br/>
                                        ✅ Plano de corte<br/>
                                        ✅ Render 4K<br/><br/>
                                        Link na bio para testar! 👇"
                                    </p>
                                    <button onClick={() => handleCopy("...")} className="w-full py-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold">Copiar Legenda</button>
                                </div>

                                <div className="bg-white dark:bg-[#2d2424] p-4 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-3 text-blue-800">
                                        <FacebookIcon /> <span className="font-bold text-sm">Facebook / Grupos</span>
                                    </div>
                                    <div className="aspect-square bg-gray-200 dark:bg-gray-800 mb-3 rounded flex items-center justify-center text-xs text-gray-500">
                                        [Imagem: Gráfico de Economia de Material]
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        "Atenção colega marceneiro! 🛑<br/><br/>
                                        Quantas chapas de MDF você joga fora por ano por erro de cálculo? Fiz as contas aqui e o prejuízo é grande.<br/><br/>
                                        Estou usando o otimizador de corte do MarcenApp e a economia é absurda. Quem quiser conhecer, comenta 'EU QUERO' que mando o link do trial."
                                    </p>
                                    <button onClick={() => handleCopy("...")} className="w-full py-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold">Copiar Legenda</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'lp':
                return (
                    <div className="animate-fadeIn bg-[#fffefb] dark:bg-[#3e3535] p-8 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                        <h3 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-6">Estrutura de Landing Page (Copy)</h3>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Use este texto para criar sua própria página de vendas ou site simples.</p>
                        
                        <div className="space-y-6 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Headline (Título)</p>
                                <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">A Marcenaria Digital Chegou na Sua Oficina</h4>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Sub-headline</p>
                                <p className="text-lg text-gray-600 dark:text-gray-300">Crie projetos 3D, gere listas de materiais e otimize planos de corte em minutos com Inteligência Artificial. Venda mais e desperdice menos.</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Benefícios (Bullets)</p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                                    <li>Renderizações 3D que encantam clientes</li>
                                    <li>Orçamentos precisos (Mão de obra + Material)</li>
                                    <li>Otimizador de corte que economiza chapas</li>
                                    <li>Acesso via celular ou computador</li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Call to Action (Botão)</p>
                                <button className="bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-6 rounded">Testar Grátis por 7 Dias</button>
                            </div>
                        </div>
                    </div>
                );
            case 'roi':
                return (
                    <div className="animate-fadeIn max-w-3xl mx-auto bg-[#fffefb] dark:bg-[#3e3535] p-8 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] shadow-lg">
                        <h3 className="text-2xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-6 flex items-center gap-2"><TargetIcon className="w-6 h-6"/> Calculadora de ROI para Parceiros</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            Simule quanto você pode ganhar construindo uma carteira de clientes recorrentes com o MarcenApp.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Leads Contactados/Mês</label>
                                <input type="number" value={roiLeads} onChange={(e) => setRoiLeads(Number(e.target.value))} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#e6ddcd] dark:border-[#4a4040] font-bold" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Taxa de Conversão (%)</label>
                                <input type="number" value={roiConversion} onChange={(e) => setRoiConversion(Number(e.target.value))} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#e6ddcd] dark:border-[#4a4040] font-bold" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Ticket Médio (Plano)</label>
                                <select value={roiTicket} onChange={(e) => setRoiTicket(Number(e.target.value))} className="w-full p-3 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#e6ddcd] dark:border-[#4a4040] font-bold">
                                    <option value={49.90}>R$ 49,90 (Pro)</option>
                                    <option value={149.90}>R$ 149,90 (Oficina)</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-xs uppercase text-gray-500 mb-1">Novos Clientes/Mês</p>
                                <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">{projectedClients}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-gray-500 mb-1">Receita Gerada</p>
                                <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">R$ {projectedRevenue.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-gray-500 mb-1">Sua Comissão (15%)</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">R$ {partnerShare.toFixed(2)}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center text-sm text-blue-800 dark:text-blue-300">
                            <strong>Visão de Longo Prazo:</strong> Mantendo esse ritmo, em 12 meses você terá uma carteira gerando <strong>R$ {(partnerShare * 12).toFixed(2)} mensais</strong> de renda passiva recorrente (considerando churn zero).
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const TabButton: React.FC<{ id: typeof activeTab, label: string }> = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === id ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-gray-100 dark:bg-[#4a4040] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#5a4f4f]'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-[#f5f1e8] dark:bg-[#2d2424] min-h-full rounded-lg">
            <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] bg-[#fffefb] dark:bg-[#3e3535] rounded-t-lg flex flex-wrap gap-2">
                <TabButton id="plan" label="Plano de Lançamento" />
                <TabButton id="emails" label="Templates de E-mail" />
                <TabButton id="social" label="Posts Redes Sociais" />
                <TabButton id="lp" label="Copy Landing Page" />
                <TabButton id="roi" label="Calculadora ROI" />
            </div>
            <div className="p-6">
                {renderContent()}
            </div>
        </div>
    );
};
