import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Envio e Entrega | Mi Brasil',
  description: 'Informações sobre prazos de entrega, frete grátis e rastreamento de pedidos na Mi Brasil.',
};

export default function EnvioPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Envio e Entrega</h1>
      <p className="text-gray-600 mb-8 sm:mb-12">
        Tudo o que você precisa saber sobre como seus produtos chegam até você.
      </p>

      {/* Frete Grátis */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Frete Grátis</h2>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-4">
          <p className="text-green-800 font-medium text-sm sm:text-base">
            Frete grátis para compras acima de R$ 200,00 para todo o Brasil!
          </p>
        </div>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Para pedidos abaixo de R$ 200,00, o valor do frete é calculado automaticamente no checkout
          com base no CEP de destino. Trabalhamos com as melhores transportadoras do Brasil para
          garantir que seu produto chegue com segurança.
        </p>
      </section>

      {/* Prazos de Entrega */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Prazos de Entrega</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-4 py-3 font-semibold rounded-tl-lg">Região</th>
                <th className="text-left px-4 py-3 font-semibold rounded-tr-lg">Prazo Estimado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">Capitais e regiões metropolitanas (Sul e Sudeste)</td>
                <td className="px-4 py-3">3 a 7 dias úteis</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">Interior (Sul e Sudeste)</td>
                <td className="px-4 py-3">5 a 10 dias úteis</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">Capitais (Norte, Nordeste e Centro-Oeste)</td>
                <td className="px-4 py-3">7 a 12 dias úteis</td>
              </tr>
              <tr>
                <td className="px-4 py-3 rounded-bl-lg">Interior (Norte, Nordeste e Centro-Oeste)</td>
                <td className="px-4 py-3 rounded-br-lg">10 a 15 dias úteis</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs sm:text-sm mt-3">
          * Os prazos são contados a partir da confirmação do pagamento e podem variar de acordo com a transportadora e a disponibilidade do produto.
        </p>
      </section>

      {/* Transportadoras */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Transportadoras</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
          Trabalhamos com diversas transportadoras parceiras através do Melhor Envio para oferecer
          as melhores opções de frete. No checkout, você poderá escolher entre diferentes
          modalidades de envio:
        </p>
        <ul className="space-y-2 text-gray-600 text-sm sm:text-base">
          <li className="flex items-start gap-2">
            <span className="text-[#FF6700] mt-1">•</span>
            <span><strong>Econômico:</strong> Opção com melhor custo-benefício, ideal para quem não tem pressa.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF6700] mt-1">•</span>
            <span><strong>Padrão:</strong> Boa relação entre preço e prazo de entrega.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF6700] mt-1">•</span>
            <span><strong>Expresso:</strong> Para quem precisa receber o mais rápido possível.</span>
          </li>
        </ul>
      </section>

      {/* Rastreamento */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Rastreamento</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Após o envio do seu pedido, você receberá um e-mail com o código de rastreamento.
          Você também pode acompanhar a entrega diretamente no seu painel de cliente,
          na seção &quot;Meus Pedidos&quot;. Caso tenha alguma dúvida sobre a entrega,
          entre em contato pelo e-mail{' '}
          <a href="mailto:contato@mibrasil.com.br" className="text-[#FF6700] hover:underline">
            contato@mibrasil.com.br
          </a>.
        </p>
      </section>

      {/* Embalagem */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Embalagem</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Todos os produtos são embalados com cuidado em caixas reforçadas com proteção interna
          (plástico bolha e espuma) para garantir que cheguem em perfeitas condições. Os produtos
          são enviados em suas embalagens originais Xiaomi.
        </p>
      </section>

      {/* CTA */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <h3 className="font-semibold mb-2">Calcule o frete do seu pedido</h3>
        <p className="text-gray-600 text-sm mb-4">
          O valor exato do frete e o prazo de entrega são calculados no checkout com base no seu CEP.
        </p>
        <a
          href="/shop"
          className="inline-block bg-[#FF6700] text-white px-6 py-3 rounded-md hover:bg-[#e55b00] transition-colors font-medium"
        >
          Ver Produtos
        </a>
      </div>
    </div>
  );
}
