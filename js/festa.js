(() => {
  const TELEFONE = '5511915072940';
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const linkZap = (texto) => `https://wa.me/${TELEFONE}?text=${encodeURIComponent(texto)}`;

  /* Faixa para o dono do salão: mensagem própria, separada do cliente simulado */
  $$('[data-dono]').forEach((a) => {
    a.href = linkZap('Vi o site de demonstração e quero um para o meu salão.');
  });

  /* Confete feito à mão, para não carregar biblioteca por um único efeito */
  const tela = $('#confete');
  const ctx = tela.getContext('2d');
  const CORES = ['#FF4F9A', '#2A2BD6', '#FFC91F', '#FF6A33', '#1FDB72'];
  let pedacos = [];
  let rodando = false;

  function ajustaTela() {
    tela.width = innerWidth;
    tela.height = innerHeight;
  }
  addEventListener('resize', ajustaTela);
  ajustaTela();

  function solta(x, y) {
    if (reduz) return;
    for (let i = 0; i < 140; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const forca = 5 + Math.random() * 15;
      pedacos.push({
        x, y,
        vx: Math.cos(angulo) * forca,
        vy: Math.sin(angulo) * forca - 8,
        g: Math.random() * Math.PI,
        vg: (Math.random() - .5) * .4,
        t: 6 + Math.random() * 8,
        cor: CORES[i % CORES.length],
        bola: i % 4 === 0,
      });
    }
    if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
  }

  function quadro() {
    ctx.clearRect(0, 0, tela.width, tela.height);
    pedacos = pedacos.filter((p) => p.y < tela.height + 30);
    pedacos.forEach((p) => {
      p.vx *= .985; p.vy += .34; p.x += p.vx; p.y += p.vy; p.g += p.vg;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.g);
      ctx.fillStyle = p.cor;
      if (p.bola) { ctx.beginPath(); ctx.arc(0, 0, p.t / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2);
      ctx.restore();
    });
    if (pedacos.length) requestAnimationFrame(quadro);
    else { rodando = false; ctx.clearRect(0, 0, tela.width, tela.height); }
  }

  /* Escolha da data: os dois formulários ficam sempre iguais */
  const formularios = $$('[data-dia]');
  const hoje = new Date();
  const hojeTexto = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const formato = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const chapeu = $('.chapeu');

  function desenhaVelas(caixa, digitos) {
    caixa.innerHTML = digitos.map((d) => `<span class="vela"><i></i><b>${d}</b></span>`).join('');
  }

  const paraData = (v) => {
    const [a, m, d] = v.split('-').map(Number);
    return new Date(a, m - 1, d);
  };
  const valida = (v) => Boolean(v) && v >= hojeTexto && v.length === 10;

  function escolhe(valor, origem) {
    const data = paraData(valor);
    const texto = formato.format(data);
    const frase = `${texto[0].toUpperCase()}${texto.slice(1)}. Anotado!`;
    formularios.forEach((f) => {
      $('[data-campo]', f).value = valor;
      $('[data-aviso]', f).textContent = frase;
      const velas = $('[data-velas]', f);
      desenhaVelas(velas, String(data.getDate()).padStart(2, '0').split(''));
      velas.classList.remove('soprou');
      void velas.offsetWidth; /* reinicia a animação do soprô */
      velas.classList.add('soprou');
    });
    if (chapeu) {
      chapeu.classList.remove('mexe');
      void chapeu.getBoundingClientRect();
      chapeu.classList.add('mexe');
    }
    const r = $('[data-velas]', origem).getBoundingClientRect();
    solta(r.left + r.width / 2, r.top + r.height / 2);
  }

  formularios.forEach((f) => {
    const campo = $('[data-campo]', f);
    const aviso = $('[data-aviso]', f);
    campo.min = hojeTexto;
    desenhaVelas($('[data-velas]', f), ['?', '?']);

    campo.addEventListener('change', () => {
      if (!campo.value) return;
      if (valida(campo.value)) escolhe(campo.value, f);
      else aviso.textContent = 'Escolha uma data a partir de hoje.';
    });

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!valida(campo.value)) {
        aviso.textContent = campo.value ? 'Escolha uma data a partir de hoje.' : 'Escolha o dia da festa para continuar.';
        campo.classList.remove('treme');
        void campo.offsetWidth;
        campo.classList.add('treme');
        campo.focus();
        return;
      }
      const dia = paraData(campo.value).toLocaleDateString('pt-BR');
      open(linkZap(`Oi! Vi o site e quero saber se o dia ${dia} está livre para uma festa de aniversário.`), '_blank', 'noopener');
    });
  });

  /* Idades: troca foto, frase e a cor da seção inteira */
  const IDADES = {
    infantil: { foto: 'img/infantil.webp', alt: 'Criança soprando as velas do bolo', frase: 'Brinquedo, bagunça e bolo na altura deles.' },
    quinze: { foto: 'img/quinze.webp', alt: 'Jovem de vestido verde em uma festa', frase: 'A entrada de que todo mundo vai falar.' },
    adulto: { foto: 'img/adulto.webp', alt: 'Amigos em volta de um bolo com velas', frase: 'Mesa farta, música boa e ninguém com pressa.' },
  };
  const idades = $('.idades');
  const foto = $('[data-foto]');
  const fraseIdade = $('[data-frase]');
  const botoesIdade = $$('[data-escolhe]');
  const ordem = Object.keys(IDADES);
  let vez = null;

  Object.values(IDADES).forEach((i) => { new Image().src = i.foto; });

  function trocaIdade(nome) {
    const d = IDADES[nome];
    idades.dataset.idade = nome;
    foto.src = d.foto;
    foto.alt = d.alt;
    fraseIdade.textContent = d.frase;
    botoesIdade.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.escolhe === nome)));
    foto.classList.remove('troca');
    void foto.offsetWidth;
    foto.classList.add('troca');
  }
  const paraGiro = () => { clearInterval(vez); vez = null; };

  botoesIdade.forEach((b) => b.addEventListener('click', () => {
    giroLiberado = false; /* quem clicou decidiu: o giro automático para de vez */
    paraGiro();
    trocaIdade(b.dataset.escolhe);
  }));

  let giroLiberado = !reduz;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && giroLiberado && !vez) {
      vez = setInterval(() => {
        const atual = ordem.indexOf(idades.dataset.idade);
        trocaIdade(ordem[(atual + 1) % ordem.length]);
      }, 3200);
    } else if (!e.isIntersecting) paraGiro();
  }, { threshold: .4 }).observe(idades);

  /* Pacotes: a régua infla o balão e troca os itens */
  const FAIXAS = [
    { ate: 40, nome: 'Soprinho', cor: '#FFC91F', itens: ['Buffet de salgados', 'Bolo e doces', 'Decoração temática', '4 horas de festa', 'Estacionamento'] },
    { ate: 90, nome: 'Sopro', cor: '#FF4F9A', itens: ['Buffet completo', 'Bolo e doces', 'Decoração temática', 'Bebidas', 'DJ', '5 horas de festa', 'Estacionamento'] },
    { ate: 150, nome: 'Ventania', cor: '#2A2BD6', itens: ['Buffet completo', 'Bolo e doces', 'Decoração temática', 'Bebidas à vontade', 'DJ', 'Pista com luz', '6 horas de festa', 'Estacionamento'] },
  ];
  const regua = $('[data-regua]');
  const numero = $('[data-numero]');
  const nomePacote = $('[data-nome]');
  const itens = $('[data-itens]');
  const balao = $('[data-balao]');
  const caixaBalao = $('.pacote-balao');
  let faixaAtual = null;

  function atualizaPacote() {
    const n = Number(regua.value);
    numero.textContent = n;
    balao.style.transform = `scale(${.5 + ((n - 20) / 130) * .55})`;
    const f = FAIXAS.find((x) => n <= x.ate);
    if (f === faixaAtual) return;
    faixaAtual = f;
    nomePacote.textContent = f.nome;
    caixaBalao.style.color = f.cor;
    itens.innerHTML = f.itens.map((t, i) => `<li style="animation-delay:${i * 35}ms">${t}</li>`).join('');
  }
  regua.addEventListener('input', atualizaPacote);
  atualizaPacote();

  /* Elementos que estouram ao entrar na tela */
  const vigia = new IntersectionObserver((lista) => {
    lista.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visto'); vigia.unobserve(e.target); }
    });
  }, { threshold: .25 });
  $$('[data-pop]').forEach((el) => vigia.observe(el));

  /* Botão flutuante: some enquanto o seletor de data já está na tela */
  const flutua = $('[data-flutua]');
  const visiveis = new Set();
  const vigiaDia = new IntersectionObserver((lista) => {
    lista.forEach((e) => (e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target)));
    flutua.classList.toggle('ativo', visiveis.size === 0);
  });
  formularios.forEach((f) => vigiaDia.observe(f));

  /* Rolagem: galeria anda para o lado e balões sobem */
  if (reduz) return;
  const espaco = $('.espaco');
  const trilho = $('.trilho');
  const paralaxe = $$('[data-vel]');
  let distancia = 0;
  let agendado = false;

  function mede() {
    distancia = Math.max(0, trilho.scrollWidth - innerWidth);
    espaco.style.height = `${distancia + innerHeight}px`;
    pinta();
  }

  function pinta() {
    agendado = false;
    const y = scrollY;
    const p = distancia ? Math.min(1, Math.max(0, (y - espaco.offsetTop) / distancia)) : 0;
    trilho.style.transform = `translate3d(${-p * distancia}px,0,0)`;
    if (y < innerHeight * 1.2) {
      paralaxe.forEach((el) => { el.style.transform = `translate3d(0,${y * Number(el.dataset.vel)}px,0)`; });
    }
  }

  addEventListener('scroll', () => {
    if (!agendado) { agendado = true; requestAnimationFrame(pinta); }
  }, { passive: true });
  addEventListener('resize', mede);
  addEventListener('load', mede);
  mede();
})();
