import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { COMPANY, PROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: { absolute: "Política de Privacidade · Dezena" },
  description:
    "Quais dados o Dezena coleta, por quê, com quem compartilha e como exercer seus direitos da LGPD. Sem venda de dados e sem rastreamento publicitário.",
  alternates: { canonical: "/privacidade" },
  robots: { index: true, follow: true },
};

const SECTIONS = [
  { id: "resumo", label: "Resumo em uma tela" },
  { id: "controlador", label: "Quem é o controlador" },
  { id: "dados", label: "Dados que coletamos" },
  { id: "finalidade", label: "Para que usamos" },
  { id: "base-legal", label: "Base legal" },
  { id: "compartilhamento", label: "Com quem compartilhamos" },
  { id: "cookies", label: "Cookies e armazenamento local" },
  { id: "retencao", label: "Por quanto tempo guardamos" },
  { id: "direitos", label: "Seus direitos" },
  { id: "seguranca", label: "Segurança" },
  { id: "menores", label: "Menores de 18 anos" },
  { id: "mudancas", label: "Mudanças nesta política" },
];

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="O que coletamos, por que coletamos e o que você pode exigir da gente a qualquer momento — conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018)."
      sections={SECTIONS}
    >
      <LegalSection id="resumo" index={1} title="Resumo em uma tela">
        <LegalList
          items={[
            <>
              <strong>Não vendemos seus dados.</strong> Nunca, para ninguém.
            </>,
            <>
              <strong>Não usamos rastreamento publicitário</strong> nem pixels
              de rede de anúncios.
            </>,
            <>
              Para navegar pelas análises, resultados e tabela de concursos,{" "}
              <strong>não é preciso criar conta</strong> — e sem conta não
              guardamos nada que identifique você.
            </>,
            <>
              Com conta, guardamos o essencial: e-mail, nome, jogos salvos, uso
              diário e status do plano.
            </>,
            <>
              <strong>Dados de cartão nunca passam por aqui</strong> — o
              pagamento acontece no ambiente do Mercado Pago.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="controlador" index={2} title="Quem é o controlador">
        <p>
          O controlador dos dados tratados nesta plataforma é o responsável
          pelo serviço {COMPANY.brand}
          {COMPANY.legalName && (
            <>
              , <strong>{COMPANY.legalName}</strong>
            </>
          )}
          {COMPANY.cnpj && <> (CNPJ {COMPANY.cnpj})</>}. Para qualquer assunto
          relacionado a dados pessoais, inclusive o exercício dos direitos
          listados abaixo, o canal é{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="dados" index={3} title="Dados que coletamos">
        <p>
          <strong>Sem conta (visitante):</strong> apenas os dados técnicos que
          qualquer servidor web registra — endereço IP, navegador, sistema e
          páginas acessadas — usados para segurança, prevenção de abuso e
          medição agregada de uso. Não montamos perfil de visitante.
        </p>
        <p>
          <strong>Com conta:</strong>
        </p>
        <LegalList
          items={[
            <>
              <strong>Cadastro:</strong> nome, e-mail e senha (armazenada com
              hash, nunca em texto puro). Se você entrar com o Google, nome,
              e-mail e foto de perfil vindos da sua conta Google. Se usar
              passkey, a chave pública do dispositivo — nunca a sua biometria.
            </>,
            <>
              <strong>Uso do produto:</strong> jogos que você gera e salva,
              loterias e estratégias escolhidas, contagem diária de gerações
              (para aplicar os limites do plano) e resultado das conferências.
            </>,
            <>
              <strong>Plano e pagamento:</strong> status do plano, data da
              compra e o identificador da transação no Mercado Pago.{" "}
              <strong>
                Não recebemos e não armazenamos número de cartão, CVV ou dados
                bancários.
              </strong>
            </>,
            <>
              <strong>Sessão:</strong> cookies de autenticação e registro do
              último acesso.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="finalidade" index={4} title="Para que usamos">
        <LegalList
          items={[
            "Autenticar você e manter sua sessão ativa.",
            "Salvar, conferir e acompanhar seus jogos ao longo dos concursos.",
            "Aplicar os limites do plano grátis e liberar o Premium após o pagamento.",
            "Prevenir abuso, fraude e uso automatizado (limitação de taxa).",
            "Responder ao seu contato de suporte.",
            "Cumprir obrigações legais, fiscais e contábeis.",
          ]}
        />
        <p>
          Não usamos seus dados para publicidade e não os enviamos para redes
          sociais ou plataformas de anúncio.
        </p>
      </LegalSection>

      <LegalSection id="base-legal" index={5} title="Base legal">
        <p>
          Tratamos dados pessoais com fundamento na{" "}
          <strong>execução do contrato</strong> (art. 7º, V da LGPD) para
          entregar o serviço que você contratou; no{" "}
          <strong>cumprimento de obrigação legal</strong> (art. 7º, II) para
          registros fiscais e de acesso; e no{" "}
          <strong>legítimo interesse</strong> (art. 7º, IX) para segurança e
          prevenção de fraude, sempre limitado ao mínimo necessário.
        </p>
      </LegalSection>

      <LegalSection
        id="compartilhamento"
        index={6}
        title="Com quem compartilhamos"
      >
        <p>
          Compartilhamos apenas o necessário para o serviço funcionar, com os
          operadores abaixo. Nenhum deles recebe autorização para usar seus
          dados para finalidade própria.
        </p>
        <ul className="mt-2 space-y-3">
          {PROCESSORS.map((p) => (
            <li key={p.name} className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="mt-0.5 text-sm">{p.role}</p>
              <p className="mt-1 text-sm text-muted-foreground/90">{p.note}</p>
            </li>
          ))}
        </ul>
        <p>
          Alguns desses serviços operam servidores fora do Brasil. A
          transferência internacional acontece nos termos do art. 33 da LGPD,
          com garantias contratuais de proteção equivalente.
        </p>
        <p>
          Também podemos divulgar dados quando houver ordem judicial ou
          requisição de autoridade competente.
        </p>
      </LegalSection>

      <LegalSection
        id="cookies"
        index={7}
        title="Cookies e armazenamento local"
      >
        <p>
          Usamos o mínimo:{" "}
          <strong>cookies de sessão</strong>, necessários para manter você
          autenticado, e <strong>armazenamento local no navegador</strong> para
          preferências suas — a loteria selecionada e a data do último uso do
          botão de atualizar. Essas preferências ficam no seu dispositivo e não
          chegam aos nossos servidores.
        </p>
        <p>
          Não usamos cookies de publicidade nem de rastreamento entre sites.
          Bloquear os cookies de sessão impede o login, mas não a navegação
          pelas páginas abertas.
        </p>
      </LegalSection>

      <LegalSection id="retencao" index={8} title="Por quanto tempo guardamos">
        <LegalList
          items={[
            "Dados da conta e jogos salvos: enquanto a conta existir.",
            "Depois do pedido de exclusão: removidos em até 30 dias, salvo o que a lei exigir manter.",
            "Registros de pagamento: pelo prazo fiscal aplicável, de 5 anos.",
            "Logs de acesso: 6 meses, conforme o Marco Civil da Internet.",
          ]}
        />
      </LegalSection>

      <LegalSection id="direitos" index={9} title="Seus direitos">
        <p>
          A LGPD garante a você, a qualquer momento e sem custo, o direito de:
        </p>
        <LegalList
          items={[
            "Confirmar que tratamos seus dados e acessar uma cópia deles.",
            "Corrigir dados incompletos, inexatos ou desatualizados.",
            "Pedir anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.",
            "Pedir a portabilidade dos seus dados a outro fornecedor.",
            "Pedir a exclusão da conta e dos dados tratados com base no consentimento.",
            "Saber com quem compartilhamos seus dados.",
            "Revogar consentimento e se opor a um tratamento.",
          ]}
        />
        <p>
          Para exercer qualquer um deles, escreva para{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>{" "}
          a partir do e-mail cadastrado. Respondemos em até 15 dias. Você
          também pode reclamar diretamente à{" "}
          <strong>ANPD — Autoridade Nacional de Proteção de Dados</strong>.
        </p>
      </LegalSection>

      <LegalSection id="seguranca" index={10} title="Segurança">
        <p>
          Todo o tráfego é criptografado em trânsito (HTTPS). Senhas são
          armazenadas com hash. O acesso ao banco de dados é restrito e
          autenticado por token. Aplicamos limitação de taxa nas rotas
          sensíveis para conter tentativas automatizadas.
        </p>
        <p>
          Nenhum sistema é perfeitamente seguro. Em caso de incidente com risco
          relevante aos seus direitos, comunicaremos você e a ANPD, conforme o
          art. 48 da LGPD.
        </p>
      </LegalSection>

      <LegalSection id="menores" index={11} title="Menores de 18 anos">
        <p>
          O serviço não é destinado a menores de 18 anos e não coletamos
          conscientemente dados dessa faixa. Identificado um cadastro de menor,
          a conta é excluída e os dados, eliminados.
        </p>
      </LegalSection>

      <LegalSection id="mudancas" index={12} title="Mudanças nesta política">
        <p>
          Se esta política mudar, a data de revisão no topo é atualizada e
          mudanças relevantes são comunicadas por e-mail ou dentro do produto.
          As regras de uso do serviço estão nos{" "}
          <Link href="/termos">Termos de Uso</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
