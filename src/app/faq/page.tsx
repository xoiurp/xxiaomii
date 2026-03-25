'use client';

import { useState } from 'react';
import { Metadata } from 'next';

interface FAQItem {
  question: string;
  answer: string;
}

const faqSections: { title: string; items: FAQItem[] }[] = [
  {
    title: 'Pedidos e Compras',
    items: [
      {
        question: 'Como faço um pedido na Mi Brasil?',
        answer:
          'Basta navegar pelo nosso catálogo, escolher o produto desejado, selecionar as opções (cor, modelo, etc.), adicionar ao carrinho e seguir para o checkout. Você precisará preencher seus dados pessoais, endereço de entrega e escolher a forma de pagamento.',
      },
      {
        question: 'Quais formas de pagamento são aceitas?',
        answer:
          'Aceitamos cartão de crédito (parcelamento em até 12x sem juros), PIX (com 8% de desconto) e boleto bancário. O desconto via PIX é aplicado automaticamente no checkout.',
      },
      {
        question: 'É seguro comprar na Mi Brasil?',
        answer:
          'Sim! Utilizamos criptografia SSL em todo o site, e nossos pagamentos são processados por gateways de pagamento certificados e seguros. Seus dados pessoais são protegidos de acordo com a LGPD.',
      },
      {
        question: 'Posso alterar ou cancelar meu pedido?',
        answer:
          'Sim, desde que o pedido ainda não tenha sido enviado. Entre em contato com nosso suporte o mais rápido possível pelo e-mail contato@mibrasil.com.br informando o número do pedido.',
      },
      {
        question: 'Como acompanho meu pedido?',
        answer:
          'Após o envio, você receberá um e-mail com o código de rastreamento. Você também pode acompanhar o status do seu pedido no seu painel de cliente, na seção "Meus Pedidos".',
      },
    ],
  },
  {
    title: 'Produtos e Garantia',
    items: [
      {
        question: 'Os produtos são originais?',
        answer:
          'Sim, todos os nossos produtos são originais Xiaomi, adquiridos de distribuidores autorizados. Somos revendedores comprometidos com a autenticidade e qualidade dos produtos.',
      },
      {
        question: 'Os produtos possuem garantia?',
        answer:
          'Sim, todos os produtos possuem garantia. Smartphones têm garantia de 12 meses e acessórios de 3 a 6 meses, conforme o tipo de produto. A garantia cobre defeitos de fabricação.',
      },
      {
        question: 'Os smartphones vêm com nota fiscal?',
        answer:
          'Sim, todos os produtos são enviados com nota fiscal eletrônica (NF-e), que também serve como comprovante de garantia.',
      },
      {
        question: 'Os smartphones funcionam com todas as operadoras do Brasil?',
        answer:
          'Sim, nossos smartphones são compatíveis com as principais operadoras brasileiras (Vivo, Claro, TIM, Oi) e suportam as bandas de frequência 4G/5G utilizadas no Brasil.',
      },
    ],
  },
  {
    title: 'Conta e Cadastro',
    items: [
      {
        question: 'Preciso criar uma conta para comprar?',
        answer:
          'Sim, é necessário criar uma conta para realizar a compra. Isso permite que você acompanhe seus pedidos, gerencie endereços e tenha acesso ao histórico de compras.',
      },
      {
        question: 'Esqueci minha senha, o que faço?',
        answer:
          'Na página de login, clique em "Esqueci minha senha". Você receberá um e-mail com instruções para redefinir sua senha.',
      },
      {
        question: 'Como altero meus dados cadastrais?',
        answer:
          'Acesse seu painel de cliente clicando no ícone de perfil no topo do site. Lá você pode atualizar seus dados pessoais, endereços e preferências.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Perguntas Frequentes</h1>
      <p className="text-gray-600 mb-8 sm:mb-12">
        Encontre respostas para as dúvidas mais comuns sobre nossos produtos, pedidos e serviços.
      </p>

      {faqSections.map((section, sIdx) => (
        <div key={sIdx} className="mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#FF6700]">
            {section.title}
          </h2>
          <div className="space-y-3">
            {section.items.map((item, iIdx) => {
              const key = `${sIdx}-${iIdx}`;
              const isOpen = openItems[key] ?? false;
              return (
                <div
                  key={key}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(key)}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-sm sm:text-base pr-4">
                      {item.question}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-4 text-gray-600 text-sm sm:text-base leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
        <h3 className="font-semibold mb-2">Não encontrou o que procurava?</h3>
        <p className="text-gray-600 text-sm mb-4">
          Entre em contato com nosso suporte e teremos prazer em ajudar.
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
