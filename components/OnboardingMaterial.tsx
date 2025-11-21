
import React, { useState } from 'react';
import { 
    CheckIcon, 
    AcademicCapIcon, 
    BookIcon, 
    VideoIcon, 
    CurrencyDollarIcon, 
    DownloadIcon,
    TrophyIcon,
    PdfIcon,
    ExcelIcon,
    LogoIcon
} from './Shared';

export const OnboardingMaterial: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'start' | 'checklist' | 'scripts' | 'simulator' | 'faq' | 'certification'>('start');

    // --- QUIZ STATE ---
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);

    const quizQuestions = [
        {
            questionText: 'Qual é a principal proposta de valor do MarcenApp?',
            answerOptions: [
                { answerText: 'Apenas um catálogo de fotos.', isCorrect: false },
                { answerText: 'Transformar ideias em projetos 3D e planos de corte em minutos usando IA.', isCorrect: true },
                { answerText: 'Uma rede social para marceneiros.', isCorrect: false },
                { answerText: 'Um software de contabilidade.', isCorrect: false },
            ],
        },
        {
            questionText: 'Qual a vantagem da "Lista de Materiais (BOM)" automática?',
            answerOptions: [
                { answerText: 'Evita erros de cálculo e desperdício de material.', isCorrect: true },
                { answerText: 'Serve apenas para decorar o projeto.', isCorrect: false },
                { answerText: 'Aumenta o custo do projeto.', isCorrect: false },
                { answerText: 'Não tem utilidade prática.', isCorrect: false },
            ],
        },
        {
            questionText: 'Para quem o plano "Oficina" é mais indicado?',
            answerOptions: [
                { answerText: 'Estudantes de design.', isCorrect: false },
                { answerText: 'Marceneiros hobbyistas.', isCorrect: false },
                { answerText: 'Marcenarias com equipes e alto volume de produção.', isCorrect: true },
                { answerText: 'Clientes finais.', isCorrect: false },
            ],
        },
        {
            questionText: 'Como funciona a geração de projetos 3D no app?',
            answerOptions: [
                { answerText: 'Precisa desenhar linha por linha manualmente.', isCorrect: false },
                { answerText: 'Através de descrições de texto ou voz interpretadas pela IA.', isCorrect: true },
                { answerText: 'Só funciona com upload de arquivos CAD.', isCorrect: false },
                { answerText: 'O app contrata um designer humano.', isCorrect: false },
            ],
        },
        {
            questionText: 'O que é o recurso "EncontraPro"?',
            answerOptions: [
                { answerText: 'Um jogo dentro do app.', isCorrect: false },
                { answerText: 'Um marketplace para conectar clientes e marceneiros.', isCorrect: true },
                { answerText: 'Uma ferramenta de busca de ferramentas.', isCorrect: false },
                { answerText: 'Um sistema de rastreamento GPS.', isCorrect: false },
            ],
        },
        {
            questionText: 'Qual a comissão padrão para parceiros nível Bronze?',
            answerOptions: [
                { answerText: '5%', isCorrect: false },
                { answerText: '10%', isCorrect: false },
                { answerText: '15%', isCorrect: true },
                { answerText: '20%', isCorrect: false },
            ],
        },
    ];

    const handleAnswerOptionClick = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(score + 1);
        }

        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < quizQuestions.length) {
            setCurrentQuestion(nextQuestion);
        } else {
            setShowScore(true);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowScore(false);
        setQuizStarted(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'start':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-[#fffefb] dark:bg-[#3e3535] p-8 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] text-center">
                            <LogoIcon className="w-16 h-16 mx-auto mb-4 text-[#3e3535] dark:text-[#f5f1e8]" />
                            <h2 className="text-2xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4">Bem-vindo à Universidade do Parceiro</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                                Você está prestes a se tornar um especialista no MarcenApp. Este treinamento foi desenhado para te dar todas as ferramentas necessárias para vender nossa solução e transformar marcenarias.
                            </p>
                            <button onClick={() => setActiveTab('checklist')} className="bg-[#d4ac6e] text-[#3e3535] font-bold py-3 px-8 rounded-lg hover:bg-[#c89f5e] transition">
                                Iniciar Jornada
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                <VideoIcon className="w-8 h-8 text-blue-500 mb-3" />
                                <h3 className="font-bold text-lg mb-2">Vídeo Aulas</h3>
                                <p className="text-sm text-gray-500">Tutoriais curtos sobre cada funcionalidade do app.</p>
                            </div>
                            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                <BookIcon className="w-8 h-8 text-green-500 mb-3" />
                                <h3 className="font-bold text-lg mb-2">Scripts de Venda</h3>
                                <p className="text-sm text-gray-500">O que falar para convencer o marceneiro.</p>
                            </div>
                            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                <TrophyIcon className="w-8 h-8 text-yellow-500 mb-3" />
                                <h3 className="font-bold text-lg mb-2">Certificação</h3>
                                <p className="text-sm text-gray-500">Teste seus conhecimentos e ganhe o selo oficial.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'checklist':
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <h3 className="text-xl font-bold mb-4">Checklist do Parceiro de Sucesso</h3>
                        {[
                            "Assistir ao vídeo de demonstração completo.",
                            "Criar uma conta de teste no MarcenApp.",
                            "Gerar seu primeiro projeto 3D.",
                            "Simular um orçamento e plano de corte.",
                            "Ler o manual de objeções.",
                            "Configurar seu link de afiliado.",
                            "Fazer o primeiro post nas redes sociais."
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-4 bg-white dark:bg-[#3e3535] rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                <div className="w-6 h-6 rounded-full border-2 border-[#d4ac6e] flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-[#d4ac6e]"></div>
                                </div>
                                <span className="text-gray-700 dark:text-gray-200">{item}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'certification':
                return (
                    <div className="animate-fadeIn max-w-2xl mx-auto">
                        {!quizStarted ? (
                            <div className="text-center p-8 bg-white dark:bg-[#3e3535] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 text-[#d4ac6e]" />
                                <h3 className="text-2xl font-bold mb-4">Exame de Certificação</h3>
                                <p className="mb-6 text-gray-600 dark:text-gray-300">
                                    Responda a {quizQuestions.length} perguntas para provar que você domina o MarcenApp. 
                                    Você precisa de pelo menos 80% de acerto para receber seu selo.
                                </p>
                                <button onClick={() => setQuizStarted(true)} className="bg-[#d4ac6e] text-[#3e3535] font-bold py-3 px-8 rounded-lg hover:bg-[#c89f5e]">
                                    Começar Prova
                                </button>
                            </div>
                        ) : showScore ? (
                            <div className="text-center p-8 bg-white dark:bg-[#3e3535] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                <h3 className="text-2xl font-bold mb-4">Resultado</h3>
                                <div className="text-4xl font-bold text-[#d4ac6e] mb-2">
                                    {score} / {quizQuestions.length}
                                </div>
                                <p className="mb-6 text-gray-600 dark:text-gray-300">
                                    {score >= Math.ceil(quizQuestions.length * 0.8) 
                                        ? "Parabéns! Você foi aprovado e agora é um Parceiro Certificado." 
                                        : "Não foi dessa vez. Revise o material e tente novamente."}
                                </p>
                                {score >= Math.ceil(quizQuestions.length * 0.8) && (
                                    <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                                        Seu selo de certificação foi liberado no seu perfil!
                                    </div>
                                )}
                                <button onClick={resetQuiz} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                                    Tentar Novamente
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                <div className="mb-4 flex justify-between text-sm text-gray-500">
                                    <span>Questão {currentQuestion + 1}/{quizQuestions.length}</span>
                                    <span>{Math.round(((currentQuestion) / quizQuestions.length) * 100)}% completo</span>
                                </div>
                                <h4 className="text-lg font-bold mb-6 text-[#3e3535] dark:text-[#f5f1e8]">
                                    {quizQuestions[currentQuestion].questionText}
                                </h4>
                                <div className="space-y-3">
                                    {quizQuestions[currentQuestion].answerOptions.map((answerOption, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerOptionClick(answerOption.isCorrect)}
                                            className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040] hover:border-[#d4ac6e] transition-all"
                                        >
                                            {answerOption.answerText}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'scripts':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl font-bold mb-4">Scripts de Venda e Objeções</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                <h4 className="font-bold text-[#d4ac6e] mb-2">"Não preciso de software, faço no papel"</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-3">
                                    "Entendo perfeitamente, o papel funciona há anos. Mas quanto tempo você leva para desenhar, calcular cada peça, orçar ferragens e passar para o cliente? E se você errar uma medida? O MarcenApp faz tudo isso em 10 minutos, sem erros, e ainda gera uma imagem 3D que encanta o cliente na hora."
                                </p>
                            </div>
                            <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                <h4 className="font-bold text-[#d4ac6e] mb-2">"É muito caro"</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-3">
                                    "Se o MarcenApp evitar que você corte uma única chapa errado por mês, ele já se pagou. O plano Profissional custa menos que uma chapa de MDF branco. Além disso, apresentando projetos em 3D, você consegue cobrar mais caro pelo seu serviço."
                                </p>
                            </div>
                            <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                <h4 className="font-bold text-[#d4ac6e] mb-2">"Não sei mexer em computador"</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-3">
                                    "Essa é a melhor parte! Você não precisa desenhar. Você pode falar com a nossa inteligência artificial, a Iara, como se estivesse mandando um áudio no WhatsApp, e ela cria o projeto para você. É muito simples, posso te mostrar agora?"
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'simulator':
                return (
                    <div className="animate-fadeIn text-center py-10">
                        <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-xl font-bold mb-2">Simulador de Ganhos</h3>
                        <p className="text-gray-500">Calcule quanto você pode ganhar vendendo o MarcenApp.</p>
                        {/* Placeholder for simulator component if needed */}
                        <p className="mt-4 text-sm text-gray-400">Acesse a aba "Materiais de Venda" para usar a calculadora de ROI completa.</p>
                    </div>
                );
            default:
                return <div className="p-10 text-center text-gray-500">Selecione um módulo para começar.</div>;
        }
    };

    const TabButton: React.FC<{ id: typeof activeTab, label: string }> = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === id ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-gray-100 dark:bg-[#4a4040] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#5a4f4f]'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-[#f5f1e8] dark:bg-[#2d2424] min-h-full rounded-lg flex flex-col">
            <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] bg-[#fffefb] dark:bg-[#3e3535] rounded-t-lg overflow-x-auto">
                <div className="flex gap-2">
                    <TabButton id="start" label="Início" />
                    <TabButton id="checklist" label="Checklist" />
                    <TabButton id="scripts" label="Scripts de Venda" />
                    <TabButton id="certification" label="Certificação" />
                </div>
            </div>
            <div className="p-6 flex-1">
                {renderContent()}
            </div>
        </div>
    );
};
