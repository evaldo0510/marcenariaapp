import { KitchenIcon, LivingRoomIcon, BedroomIcon, BathroomIcon, ClosetIcon, OfficeIcon, BalconyIcon, PantryIcon, WineCellarIcon } from '../components/Shared';

export const projectTypePresets = [
    { id: 'cozinha', name: 'Cozinha', icon: KitchenIcon, gender: 'f', suggestions: [
        'Cozinha em L com armários superiores e inferiores, e espaço para torre quente.',
        'Cozinha linear com bancada de granito São Gabriel e armários com portas de vidro.',
        'Cozinha gourmet com ilha central grande, cooktop e coifa suspensa.',
        'Cozinha pequena e funcional, otimizando o espaço com armários até o teto.',
        'Cozinha integrada com a sala, no estilo americano, com um balcão para refeições rápidas.'
    ]},
    { id: 'sala', name: 'Sala', icon: LivingRoomIcon, gender: 'f', suggestions: [
        'Painel de TV ripado para a sala, ocupando toda a parede, com rack suspenso e nichos iluminados.',
        'Estante de livros do chão ao teto, com espaço para TV e objetos de decoração.',
        'Móvel para home theater com gavetões e portas basculantes para aparelhos eletrônicos.',
        'Rack baixo e comprido com design minimalista, para uma sala de estar moderna.',
        'Barzinho de canto com adega, espaço para taças e iluminação de destaque.'
    ]},
    { id: 'quarto', name: 'Quarto', icon: BedroomIcon, gender: 'm', suggestions: [
        'Guarda-roupa de casal com 6 portas de abrir, maleiro interno e gaveteiros.',
        'Armário com portas de correr, sendo uma delas com espelho, e divisórias internas personalizadas.',
        'Cabeceira de cama que se estende pela parede, com mesas de cabeceira suspensas integradas.',
        'Penteadeira camarim com espelho iluminado e gavetas com divisórias para maquiagem.',
        'Painel para TV no quarto, com nicho para aparelhos e prateleiras decorativas.'
    ]},
    { id: 'banheiro', name: 'Banheiro', icon: BathroomIcon, gender: 'm', suggestions: [
        'Gabinete de banheiro suspenso com duas gavetas e cuba de sobrepor.',
        'Armário superior para banheiro com espelho e prateleiras internas.',
        'Bancada de mármore branco com armário inferior para guardar toalhas e produtos.',
        'Torre de armários vertical para banheiro, aproveitando o espaço ao lado do vaso.',
        'Nicho embutido na área do box, feito com o mesmo material da bancada.'
    ]},
    { id: 'closet', name: 'Closet', icon: ClosetIcon, gender: 'm', suggestions: [
        'Closet aberto (sem portas) com divisões para roupas longas, curtas e prateleiras.',
        'Closet com ilha central de gaveteiros para acessórios e tampo de vidro.',
        'Armário para closet com sapateira deslizante e cabideiros basculantes.',
        'Closet em U aproveitando três paredes, com iluminação de LED embutida nos cabideiros.',
        'Módulos de gavetas com divisórias para jóias, gravatas e cintos.'
    ]},
    { id: 'escritorio', name: 'Escritório', icon: OfficeIcon, gender: 'm', suggestions: [
        'Bancada de trabalho para duas pessoas, com gaveteiros individuais e nichos.',
        'Estante para home office com prateleiras para livros e armários fechados para documentos.',
        'Mesa de escritório em L com tampo de madeira e estrutura metálica.',
        'Armário alto para escritório com portas e chaves, para armazenamento seguro.',
        'Prateleiras suspensas acima da bancada para itens de acesso rápido.'
    ]},
    { id: 'varanda', name: 'Varanda', icon: BalconyIcon, gender: 'f', suggestions: [
        'Armário para área gourmet de varanda, com espaço para churrasqueira elétrica e frigobar.',
        'Bancada na varanda com pia e cooktop de uma boca, para preparo de alimentos.',
        'Banco baú para varanda, que serve como assento e para guardar objetos.',
        'Floreira/Jardim vertical planejado para temperos e plantas.',
        'Armário ripado para esconder a condensadora do ar condicionado.'
    ]},
    { id: 'despensa', name: 'Despensa', icon: PantryIcon, gender: 'f', suggestions: [
        'Armário para despensa com prateleiras reguláveis para diferentes alturas de mantimentos.',
        'Prateleiras de canto para otimizar o espaço em uma despensa pequena.',
        'Gavetões com corrediças reforçadas para itens pesados como sacos de arroz.',
        'Armário tipo fruteira com cestos aramados deslizantes.',
        'Módulo com nichos verticais para guardar formas e travessas.'
    ]},
    { id: 'adega', name: 'Adega', icon: WineCellarIcon, gender: 'f', suggestions: [
        'Adega com nichos em formato de colmeia para armazenamento de garrafas de vinho.',
        'Cristaleira com portas de vidro e iluminação interna para expor taças e copos.',
        'Móvel bar com bancada para degustação e armário inferior para bebidas destiladas.',
        'Painel com suportes individuais para garrafas, criando uma parede decorativa.',
        'Armário climatizado para vinhos, embutido em um móvel planejado.'
    ]},
];

export const initialStylePresets = [
    'Moderno',
    'Industrial Moderno',
    'Contemporâneo',
    'Industrial',
    'Rústico',
    'Minimalista',
    'Clássico',
    'Escandinavo'
];