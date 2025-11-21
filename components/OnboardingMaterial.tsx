
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