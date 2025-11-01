import React, { useState, useRef } from 'react';
import { LogoIcon, CubeIcon, BlueprintIcon, BookIcon, ToolsIcon, CurrencyDollarIcon, StarIcon, CheckIcon } from './Shared';

interface LandingPageProps {
  onLoginSuccess: (email: string) => void;
}

const plans = [
  {
    name: 'Hobby',
    price: 'Grátis',
    priceDescription: 'para sempre',
    description: 'Ideal para entusiastas e projetos pessoais.',
    features: [
      '5 projetos por mês',
      'Geração de imagens 3D',
      'Geração de planta baixa 2D',
      'Histórico de projetos',
      'Suporte da comunidade',
    ],
    cta: 'Começar Agora',
    planId: 'hobby',
  },
  {
    name: 'Profissional',
    price: 'R$ 49,90',
    priceDescription: '/mês',
    description: 'Para marceneiros autônomos e designers.',
    features: [
      'Projetos ilimitados',
      'Todas as funcionalidades do Hobby',
      'Geração de BOM e Plano de Corte',
      'Estimativa de Custos',
      'Gerenciamento de Clientes',
      'Propostas em PDF',
      'Suporte prioritário por e-mail',
    ],
    cta: 'Escolher Profissional',
    planId: 'pro',
    popular: true,
  },
  {
    name: 'Oficina',
    price: 'R$ 149,90',
    priceDescription: '/mês',
    description: 'Para marcenarias com equipes e alto volume.',
    features: [
      'Todas as funcionalidades do Profissional',
      'Ferramentas para equipes (Em breve)',
      'Relatórios Avançados de Produtividade',
      'Compra automática de materiais (Beta)',
      'Integração WhatsApp (Beta)',
      'Acesso antecipado a novas funcionalidades',
    ],
    cta: 'Escolher Oficina',
    planId: 'business',
  },
];

const PlanCard: React.FC<{ plan: typeof plans[0]; onSelect: () => void; }> = ({ plan, onSelect }) => {
  const isPopular = plan.popular;
  return (
    <div className={`relative flex flex-col rounded-xl border p-6 shadow-lg transition-all duration-300 ${isPopular ? 'border-[#d4ac6e] bg-[#fffefb] dark:bg-[#3e3535] scale-105' : 'border-[#e6ddcd] dark:border-[#4a4040] bg-white dark:bg-[#2d2424] hover:shadow-xl'}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4ac6e] text-[#3e3535] px-4 py-1 rounded-full text-sm font-semibold shadow-md">
          Mais Popular
        </div>
      )}
      <div className="flex-grow">
        <h3 className="text-2xl font-bold font-serif text-center text-[#3e3535] dark:text-[#f5f1e8]">{plan.name}</h3>
        <div className="mt-4 text-center">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">{plan.priceDescription}</span>
        </div>
        <p className="mt-2 text-center text-[#8a7e7e] dark:text-[#a89d8d] h-12">{plan.description}</p>
        <ul className="mt-6 space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon className="w-6 h-6 text-green-500 flex-shrink-0 mr-3" />
              <span className="text-[#3e3535] dark:text-[#f5f1e8]">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <button 
        onClick={onSelect}
        className={`w-full mt-8 font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ${isPopular ? 'bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535]' : 'bg-[#e6ddcd] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f]'}`}
      >
        {plan.cta}
      </button>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-[#fffefb]/60 dark:bg-[#3e3535]/60 p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="inline-block p-4 bg-[#e6ddcd] dark:bg-[#4a4040] rounded-full mb-4 text-[#b99256] dark:text-[#d4ac6e]">
            {icon}
        </div>
        <h3 className="text-xl font-semibold font-serif mb-2 text-[#3e3535] dark:text-[#f5f1e8]">{title}</h3>
        <p className="text-[#6a5f5f] dark:text-[#c7bca9]">{children}</p>
    </div>
);

const TestimonialCard: React.FC<{ quote: string; name: string; role: string; }> = ({ quote, name, role }) => (
    <div className="bg-[#fffefb] dark:bg-[#3e3535] p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] shadow-md">
        <div className="flex text-yellow-500 mb-4">
            <StarIcon isFavorite /> <StarIcon isFavorite /> <StarIcon isFavorite /> <StarIcon isFavorite /> <StarIcon isFavorite />
        </div>
        <p className="text-[#6a5f5f] dark:text-[#c7bca9] italic mb-4">"{quote}"</p>
        <div>
            <p className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">{name}</p>
            <p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d]">{role}</p>
        </div>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const loginRef = useRef<HTMLDivElement>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            if (email.trim() && email.includes('@')) {
                onLoginSuccess(email);
            } else {
                setError('Por favor, insira um e-mail válido.');
            }
            setIsLoading(false);
        }, 1000);
    };

    const scrollToLogin = () => {
        loginRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="bg-[#f5f1e8] dark:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8] animate-fadeIn">
            {/* Header */}
            <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-[#f5f1e8]/80 dark:bg-[#2d2424]/80 backdrop-blur-sm sticky top-0 z-30 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                <div className="flex items-center gap-3">
                    <LogoIcon className="w-8 h-8" />
                    <h1 className="text-2xl font-semibold tracking-tight">MarcenApp</h1>
                </div>
                <button
                    onClick={scrollToLogin}
                    className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-6 rounded-lg hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition"
                >
                    Acessar
                </button>
            </header>

            <main>
                {/* Hero Section */}
                <section className="text-center py-20 md:py-32 px-6" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,172,110,0.08) 0%, rgba(245,241,232,0) 60%)' }}>
                    <h2 className="text-4xl md:text-6xl font-bold font-serif mb-4 animate-fadeInUp">
                        Transforme Ideias em Móveis Planejados. <span className="text-[#b99256] dark:text-[#d4ac6e]">Em Minutos.</span>
                    </h2>
                    <p className="text-lg md:text-xl max-w-3xl mx-auto text-[#6a5f5f] dark:text-[#c7bca9] mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                        De um simples rascunho à proposta final. Use nossa IA, Iara, para criar projetos 3D, planos de corte e orçamentos que impressionam seus clientes e otimizam sua produção.
                    </p>
                    <button
                        onClick={scrollToLogin}
                        className="bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg animate-fadeInUp"
                        style={{ animationDelay: '0.4s' }}
                    >
                        Comece a Criar Agora &rarr;
                    </button>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 px-6 bg-[#fffefb] dark:bg-[#3e3535]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-serif">A Marcenaria do Futuro, Hoje.</h2>
                            <p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9] mt-2">Ferramentas inteligentes para cada etapa do seu projeto.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard icon={<CubeIcon className="w-8 h-8"/>} title="Projetos 3D Fotorrealistas">
                                Crie visualizações impressionantes a partir de descrições, fotos ou rascunhos. Mostre ao seu cliente exatamente como o móvel ficará.
                            </FeatureCard>
                            <FeatureCard icon={<BlueprintIcon className="w-8 h-8"/>} title="Plantas Técnicas 2D">
                                Converta automaticamente seus modelos 3D em plantas baixas e vistas técnicas com dimensionamento, prontas para a oficina.
                            </FeatureCard>
                             <FeatureCard icon={<BookIcon className="w-8 h-8"/>} title="Lista de Materiais (BOM)">
                                Gere uma lista detalhada de todas as chapas, ferragens e acessórios necessários, evitando erros e desperdícios na compra.
                            </FeatureCard>
                            <FeatureCard icon={<ToolsIcon className="w-8 h-8"/>} title="Plano de Corte Otimizado">
                                Receba um diagrama visual de como cortar as peças nas chapas, maximizando o aproveitamento do material e reduzindo custos.
                            </FeatureCard>
                            <FeatureCard icon={<CurrencyDollarIcon className="w-8 h-8"/>} title="Orçamentos e Propostas">
                                Estime custos de material e mão de obra com ajuda da IA e gere propostas comerciais profissionais em PDF com um clique.
                            </FeatureCard>
                             <FeatureCard icon={<LogoIcon className="w-8 h-8"/>} title="Assistente Iara">
                                Nossa IA especialista em marcenaria está sempre pronta para ajudar, desde a busca por tendências até a otimização de projetos.
                            </FeatureCard>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-20 px-6">
                     <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-serif">O que os Marceneiros Dizem</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <TestimonialCard 
                                name="Carlos Ferreira"
                                role="Marceneiro, 15 anos de experiência"
                                quote="O MarcenApp reduziu o tempo que eu levava para fazer propostas de 2 dias para 30 minutos. Meus clientes ficam impressionados com o 3D."
                            />
                             <TestimonialCard 
                                name="Juliana Andrade"
                                role="Designer de Móveis"
                                quote="A geração da lista de materiais e do plano de corte é fantástica. Acabou o erro de cálculo na hora de comprar as chapas. A economia é real."
                            />
                             <TestimonialCard 
                                name="Ricardo Martins"
                                role="Dono de Marcenaria"
                                quote="Consigo apresentar projetos muito mais profissionais e fechar mais negócios. É como ter um designer e um engenheiro na equipe."
                            />
                        </div>
                     </div>
                </section>

                {/* Plans Section */}
                <section id="plans" className="py-20 px-6 bg-[#fffefb] dark:bg-[#3e3535]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-serif">Planos Flexíveis para o seu Negócio</h2>
                            <p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9] mt-2">Comece de graça e evolua conforme suas necessidades.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {plans.map(plan => (
                                <PlanCard key={plan.name} plan={plan} onSelect={scrollToLogin} />
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Login/CTA Section */}
                <section id="login" ref={loginRef} className="py-20 px-6">
                    <div className="w-full max-w-md mx-auto">
                        <div className="flex flex-col items-center mb-8">
                            <h2 className="text-3xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] text-center">Pronto para revolucionar sua marcenaria?</h2>
                            <p className="text-[#6a5f5f] dark:text-[#c7bca9] text-lg mt-2 text-center">Acesse sua conta ou crie um acesso gratuito para começar.</p>
                        </div>
                        <div className="bg-[#fffefb]/80 dark:bg-[#4a4040] backdrop-blur-sm p-8 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-2xl shadow-stone-300/30 dark:shadow-black/30">
                            <h3 className="text-2xl font-serif font-semibold text-center text-[#3e3535] dark:text-[#f5f1e8] mb-6">Acesse sua conta</h3>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="email-landing" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9]">
                                        Seu melhor e-mail
                                    </label>
                                    <input
                                        id="email-landing"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-1 block w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#5a4f4f] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-[#3e3535] bg-[#d4ac6e] hover:bg-[#c89f5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d4ac6e] transition disabled:opacity-50"
                                    >
                                        {isLoading ? 'Verificando...' : 'Entrar / Cadastrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#e6ddcd] dark:bg-[#2d2424] text-[#6a5f5f] dark:text-[#a89d8d] py-8 px-6 text-center">
                <p>&copy; {new Date().getFullYear()} MarcenApp. Todos os direitos reservados.</p>
                <p className="text-sm mt-2">Feito para marceneiros, por apaixonados por tecnologia e design.</p>
            </footer>
        </div>
    );
};