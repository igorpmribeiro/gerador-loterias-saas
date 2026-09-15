import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { COMPANY, REFUND_DAYS } from "@/lib/legal";
import { FREE_LIMITS, LIFETIME_PRICE, formatBRL } from "@/lib/plans";

export const metadata: Metadata = {
  title: { absolute: "Termos de Uso · Dezena" },
  description:
    "Condições de uso do Dezena: o que o serviço faz e o que não faz, plano grátis, Premium vitalício, pagamento, direito de arrependimento de 7 dias e responsabilidades.",
  alternates: { canonical: "/termos" },
  robots: { index: true, follow: true },
};

const SECTIONS = [
  { id: "servico", label: "O que o Dezena é" },
  { id: "nao-e", label: "O que o Dezena não é" },
  { id: "idade", label: "Idade mínima" },
  { id: "conta", label: "Sua conta" },
  { id: "planos", label: "Grátis e Premium" },
  { id: "pagamento", label: "Pagamento" },
  { id: "arrependimento", label: "Arrependimento e reembolso" },
  { id: "uso", label: "Uso aceitável" },
  { id: "dados", label: "Dados da Caixa" },
  { id: "disponibilidade", label: "Disponibilidade" },
  { id: "responsabilidade", label: "Limite de responsabilidade" },
  { id: "encerramento", label: "Encerramento" },
  { id: "mudancas", label: "Mudanças nestes termos" },
  { id: "contato", label: "Contato e foro" },
];

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro="As regras do jogo entre você e o Dezena, em português claro. Se alguma parte não estiver clara, escreva para a gente antes de assinar embaixo."
      sections={SECTIONS}
    >
      <LegalSection id="servico" index={1} title="O que o Dezena é">
        <p>
          O Dezena é uma plataforma independente de{" "}
          <strong>análise estatística de resultados de loteria</strong> e de{" "}
          <strong>geração de jogos por método</strong>, para a Mega-Sena e a
          Lotofácil. Ele organiza o histórico oficial de concursos, calcula
          indicadores descritivos (frequência, atraso, soma, paridade,
          afinidade entre dezenas, entre outros) e monta combinações a partir
          dos critérios que você escolhe.
        </p>
        <p>
          Ao criar uma conta ou usar qualquer parte do site, você concorda com
          estes Termos e com a{" "}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </LegalSection>

      <LegalSection id="nao-e" index={2} title="O que o Dezena não é">
        <p>
          Isto é o ponto mais importante de todo este documento:{" "}
          <strong>
            nenhuma funcionalidade do Dezena aumenta a sua chance real de
            ganhar
          </strong>
          . Loteria é jogo de azar e cada sorteio é um evento independente: em
          todo concurso, cada dezena tem exatamente a mesma probabilidade de
          ser sorteada.
        </p>
        <LegalList
          items={[
            <>
              As análises <strong>descrevem o passado</strong>. Elas não preveem
              nem influenciam resultados futuros.
            </>,
            <>
              A <strong>nota de confiança</strong> de um jogo gerado mede a
              afinidade daquela combinação com padrões históricos. Não é
              probabilidade de prêmio, e uma nota alta não vale mais do que uma
              nota baixa no sorteio.
            </>,
            <>
              A <strong>garantia dos fechamentos</strong> é uma propriedade
              matemática do desdobramento, sempre condicionada: se um número
              determinado das suas dezenas for sorteado, pelo menos um dos
              jogos atinge a faixa indicada. Ela não garante que suas dezenas
              serão sorteadas.
            </>,
            <>
              O Dezena <strong>não registra apostas</strong> e não tem vínculo
              com a Caixa Econômica Federal. A aposta é feita por você, em
              canal oficial.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="idade" index={3} title="Idade mínima">
        <p>
          O serviço é destinado a maiores de 18 anos, idade mínima legal para
          apostar em loterias no Brasil. Ao usar a plataforma, você declara ter
          18 anos ou mais.
        </p>
      </LegalSection>

      <LegalSection id="conta" index={4} title="Sua conta">
        <p>
          Boa parte do conteúdo — análises, tabela de concursos, resultados e
          sorteios especiais — é aberta e não exige cadastro. Para gerar e
          salvar jogos, é preciso criar uma conta com e-mail e senha, com o
          Google ou com uma chave de acesso (passkey).
        </p>
        <LegalList
          items={[
            "Você é responsável por manter suas credenciais em segurança e por tudo que acontecer na sua conta.",
            "Os dados informados no cadastro devem ser verdadeiros e atuais.",
            "Uma conta pertence a uma única pessoa. Compartilhar acesso Premium com terceiros é uso indevido.",
          ]}
        />
      </LegalSection>

      <LegalSection id="planos" index={5} title="Grátis e Premium">
        <p>
          O plano <strong>Grátis</strong> dá acesso a todas as análises e à
          tabela de concursos, a {FREE_LIMITS.generationsPerDay} gerações por
          dia ({FREE_LIMITS.gamesPerGeneration} jogos por geração) e a até{" "}
          {FREE_LIMITS.savedGames} jogos salvos. Ele é gratuito por tempo
          indeterminado e não exige cartão.
        </p>
        <p>
          O <strong>Premium</strong> é um pagamento único que libera geração
          ilimitada e em lote, jogos salvos ilimitados, fechamentos
          (desdobramentos) e conferência automática de resultados. Não é
          assinatura: não há mensalidade, renovação automática nem cobrança
          recorrente.
        </p>
        <p>
          &ldquo;Vitalício&rdquo; significa: enquanto o Dezena existir e operar
          este serviço, o seu acesso Premium continua valendo, sem nova
          cobrança. Se o serviço for descontinuado, avisaremos com
          antecedência razoável por e-mail e disponibilizaremos a exportação
          dos seus jogos salvos.
        </p>
        <p>
          Os limites do plano grátis e o conjunto de recursos do Premium podem
          ser ajustados com aviso prévio. Recursos já pagos não são removidos
          do Premium.
        </p>
      </LegalSection>

      <LegalSection id="pagamento" index={6} title="Pagamento">
        <p>
          O Premium custa {formatBRL(LIFETIME_PRICE.launch)} no preço de
          lançamento (preço cheio: {formatBRL(LIFETIME_PRICE.full)}), em
          pagamento único. A cobrança é processada pelo{" "}
          <strong>Mercado Pago</strong>, que aceita Pix, boleto e cartão.
        </p>
        <LegalList
          items={[
            "Os dados do seu meio de pagamento são digitados no ambiente do Mercado Pago e não passam pelos nossos servidores.",
            "O acesso Premium é liberado na confirmação do pagamento pelo Mercado Pago. Pix costuma ser imediato; boleto pode levar até três dias úteis.",
            "Preços são em reais (BRL) e podem mudar para novas compras. Uma mudança de preço nunca gera cobrança adicional para quem já pagou.",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="arrependimento"
        index={7}
        title="Arrependimento e reembolso"
      >
        <p>
          Como a contratação acontece pela internet, você tem{" "}
          <strong>
            {REFUND_DAYS} dias corridos, contados do pagamento, para desistir e
            receber 100% do valor de volta
          </strong>{" "}
          — é o direito de arrependimento do artigo 49 do Código de Defesa do
          Consumidor. Não é preciso justificar o motivo e não há pegadinha:
          basta escrever para{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>{" "}
          a partir do e-mail da conta.
        </p>
        <p>
          O estorno é feito pelo mesmo meio do pagamento, em até 10 dias
          corridos após o pedido, e o acesso Premium volta ao plano grátis. Os
          seus jogos salvos permanecem na conta.
        </p>
        <p>
          Passados os {REFUND_DAYS} dias, o pagamento não é reembolsável, salvo
          falha nossa na entrega do serviço.
        </p>
      </LegalSection>

      <LegalSection id="uso" index={8} title="Uso aceitável">
        <p>Ao usar a plataforma, você se compromete a não:</p>
        <LegalList
          items={[
            "Automatizar acessos, raspar conteúdo em massa ou contornar os limites do plano grátis.",
            "Revender, sublicenciar ou redistribuir as análises e os jogos gerados como se fossem produto próprio.",
            "Tentar acessar contas de terceiros, dados do banco ou áreas restritas do sistema.",
            "Usar o serviço para prometer a terceiros ganhos, retornos ou resultados em loteria.",
          ]}
        />
        <p>
          O conteúdo, o código, a marca e o design do Dezena são nossos. Os
          jogos que você gera e salva são seus, e você pode usá-los como
          quiser nas suas próprias apostas.
        </p>
      </LegalSection>

      <LegalSection id="dados" index={9} title="Dados da Caixa">
        <p>
          Os resultados vêm da API pública de loterias da Caixa Econômica
          Federal e são sincronizados diariamente, após os sorteios. Fazemos
          esforço para manter tudo íntegro e atualizado, mas{" "}
          <strong>
            a fonte oficial e definitiva de qualquer resultado é a própria
            Caixa
          </strong>
          . Em caso de divergência, vale o que a Caixa publica.
        </p>
        <p>
          O Dezena é um serviço independente, sem qualquer vínculo,
          patrocínio ou autorização da Caixa Econômica Federal.
        </p>
      </LegalSection>

      <LegalSection id="disponibilidade" index={10} title="Disponibilidade">
        <p>
          O serviço é oferecido &ldquo;como está&rdquo;. Fazemos o possível
          para mantê-lo disponível, mas pode haver interrupção por manutenção,
          falha de terceiros (hospedagem, banco de dados, API da Caixa) ou
          motivo fora do nosso controle. Não garantimos operação ininterrupta
          nem ausência de erros.
        </p>
      </LegalSection>

      <LegalSection
        id="responsabilidade"
        index={11}
        title="Limite de responsabilidade"
      >
        <p>
          <strong>
            Você é o único responsável pelas apostas que decide fazer
          </strong>
          , pelos valores que gasta e pelo resultado delas. O Dezena não
          responde por prêmios não obtidos, por valores apostados, por lucros
          cessantes nem por decisões tomadas com base nas análises.
        </p>
        <p>
          Nos limites permitidos pela lei, nossa responsabilidade total
          relacionada ao serviço fica limitada ao valor que você efetivamente
          pagou por ele. Nada aqui afasta direitos que o Código de Defesa do
          Consumidor garante a você.
        </p>
      </LegalSection>

      <LegalSection id="encerramento" index={12} title="Encerramento">
        <p>
          Você pode encerrar sua conta quando quiser, em Configurações ou
          pedindo por e-mail. Podemos suspender ou encerrar contas que violem
          estes Termos, com aviso prévio sempre que possível; em caso de
          encerramento por violação dentro do prazo de arrependimento, o valor
          pago é devolvido proporcionalmente.
        </p>
      </LegalSection>

      <LegalSection id="mudancas" index={13} title="Mudanças nestes termos">
        <p>
          Estes Termos podem ser atualizados. A data da última revisão fica no
          topo desta página e mudanças relevantes são avisadas por e-mail ou
          dentro do produto, com antecedência mínima de 15 dias. Continuar
          usando o serviço depois da vigência significa concordar com a nova
          versão.
        </p>
      </LegalSection>

      <LegalSection id="contato" index={14} title="Contato e foro">
        <p>
          Dúvida, reclamação ou pedido de reembolso:{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>
          . Respondemos em até 5 dias úteis.
        </p>
        {(COMPANY.legalName || COMPANY.cnpj) && (
          <p>
            Responsável pelo serviço:{" "}
            {COMPANY.legalName && <strong>{COMPANY.legalName}</strong>}
            {COMPANY.legalName && COMPANY.cnpj && " — "}
            {COMPANY.cnpj && <>CNPJ {COMPANY.cnpj}</>}
            {COMPANY.location && <> · {COMPANY.location}</>}.
          </p>
        )}
        <p>
          Estes Termos são regidos pela lei brasileira. Fica eleito o foro do
          domicílio do consumidor para resolver qualquer controvérsia.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
