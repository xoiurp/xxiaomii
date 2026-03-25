import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Devolução | Mi Brasil',
  description: 'Conheça nossa política de devolução, trocas e reembolso de produtos Xiaomi.',
};

export default function PoliticaDeDevolucaoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Política de Devolução</h1>
      <p className="text-gray-600 mb-8 sm:mb-12">
        Sua satisfação é nossa prioridade. Conheça nossos termos para trocas, devoluções e reembolsos.
      </p>

      {/* Direito de Arrependimento */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Direito de Arrependimento</h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-4">
          <p className="text-blue-800 font-medium text-sm sm:text-base">
            De acordo com o Código de Defesa do Consumidor (Art. 49), você tem até 7 dias corridos após o recebimento do produto para solicitar a devolução por arrependimento, sem necessidade de justificativa.
          </p>
        </div>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Para exercer o direito de arrependimento, o produto deve estar em sua embalagem original,
          sem sinais de uso, com todos os acessórios e manuais inclusos. Nesse caso, o reembolso
          será integral, incluindo o valor do frete.
        </p>
      </section>

      {/* Troca por Defeito */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Troca por Defeito</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
          Se o produto apresentar defeito de fabricação, você pode solicitar a troca dentro dos seguintes prazos:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-4 py-3 font-semibold rounded-tl-lg">Tipo de Produto</th>
                <th className="text-left px-4 py-3 font-semibold rounded-tr-lg">Prazo de Garantia</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">Smartphones</td>
                <td className="px-4 py-3">12 meses</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">Smartwatches e Smartbands</td>
                <td className="px-4 py-3">6 meses</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">Fones de ouvido e acessórios</td>
                <td className="px-4 py-3">3 meses</td>
              </tr>
              <tr>
                <td className="px-4 py-3 rounded-bl-lg">Produtos de casa inteligente</td>
                <td className="px-4 py-3 rounded-br-lg">6 meses</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs sm:text-sm mt-3">
          * A garantia cobre exclusivamente defeitos de fabricação. Danos por mau uso, quedas ou contato com líquidos não são cobertos.
        </p>
      </section>

      {/* Como Solicitar */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Como Solicitar uma Devolução ou Troca</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#FF6700] text-white font-semibold text-sm">
              1
            </div>
            <div>
              <h3 className="font-medium mb-1">Entre em contato</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Envie um e-mail para{' '}
                <a href="mailto:contato@mibrasil.com.br" className="text-[#FF6700] hover:underline">
                  contato@mibrasil.com.br
                </a>{' '}
                com o número do pedido, fotos do produto (se houver defeito) e o motivo da solicitação.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#FF6700] text-white font-semibold text-sm">
              2
            </div>
            <div>
              <h3 className="font-medium mb-1">Aguarde a análise</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Nossa equipe analisará sua solicitação em até 3 dias úteis e retornará com as instruções de envio.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#FF6700] text-white font-semibold text-sm">
              3
            </div>
            <div>
              <h3 className="font-medium mb-1">Envie o produto</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Após aprovação, você receberá uma etiqueta de envio pré-paga. Embale o produto com cuidado em sua embalagem original e poste nos Correios ou na transportadora indicada.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#FF6700] text-white font-semibold text-sm">
              4
            </div>
            <div>
              <h3 className="font-medium mb-1">Receba o reembolso ou produto novo</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Após recebermos e verificarmos o produto, processaremos a troca ou reembolso em até 10 dias úteis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reembolso */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Formas de Reembolso</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-4 py-3 font-semibold rounded-tl-lg">Forma de Pagamento Original</th>
                <th className="text-left px-4 py-3 font-semibold rounded-tr-lg">Como o Reembolso é Feito</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">Cartão de crédito</td>
                <td className="px-4 py-3">Estorno na fatura em até 2 ciclos de fechamento</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">PIX</td>
                <td className="px-4 py-3">Transferência via PIX em até 10 dias úteis</td>
              </tr>
              <tr>
                <td className="px-4 py-3 rounded-bl-lg">Boleto bancário</td>
                <td className="px-4 py-3 rounded-br-lg">Transferência bancária em até 10 dias úteis</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Exceções */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF6700]/10 text-[#FF6700]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Exceções</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3">
          Não aceitamos devoluções ou trocas nos seguintes casos:
        </p>
        <ul className="space-y-2 text-gray-600 text-sm sm:text-base">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Produtos com sinais de uso, riscos, amassados ou danos causados pelo consumidor.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Produtos sem embalagem original ou com acessórios faltando.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Danos causados por mau uso, quedas, contato com líquidos ou uso de acessórios não compatíveis.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Solicitações realizadas após o prazo de garantia ou direito de arrependimento.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Produtos com o lacre de garantia violado (quando aplicável).</span>
          </li>
        </ul>
      </section>

      {/* CTA */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <h3 className="font-semibold mb-2">Precisa de ajuda com uma devolução?</h3>
        <p className="text-gray-600 text-sm mb-4">
          Nossa equipe está pronta para ajudar com qualquer dúvida sobre trocas e devoluções.
        </p>
        <a
          href="mailto:contato@mibrasil.com.br"
          className="inline-block bg-[#FF6700] text-white px-6 py-3 rounded-md hover:bg-[#e55b00] transition-colors font-medium"
        >
          Falar com o Suporte
        </a>
      </div>
    </div>
  );
}
