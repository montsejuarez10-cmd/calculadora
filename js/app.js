  // Las opciones del menú. Cada una trae su título, su descripción, lo que abre
  // —una herramienta embebida o una lista de descargas— y el color con el que
  // se tiñen su botón y su ventana.
  var OPCIONES = {
    "1": { slug: "falda", titulo: "Falda Base", desc: "Trazado técnico interactivo de la silueta completa (delantero y trasero), con la regla 50-32-18.", embebido: "falda_base_interactivo.html", color: "#ec5151" },
    "2": { slug: "cuerpo", titulo: "Cuerpo Base", desc: "Trazado del bloque delantero y espalda resolviendo el ajuste a la prominencia del pecho y el reparto 25-40-35 a la cintura.", embebido: "cuerpo_base_interactivo.html", color: "#f27b2c" },
    "3": { slug: "manga", titulo: "Manga Base", desc: "Trazado proporcional de la copa y de la forma de la manga, sacado del recorrido de las dos sisas del cuerpo base.", embebido: "manga_base_interactivo.html", color: "#ffa875" },
    "4": { slug: "pantalon", titulo: "Pantalón Base", desc: "Trazado del delantero y la espalda sobre el rectángulo de cuarto de cadera, con el avance de tiro sacado de la cadera y el reparto de la cintura en costados y pinzas según el tipo de glúteos.", embebido: "pantalon_base_interactivo.html", color: "#90aada" },
    "5": { slug: "panuelo", titulo: "Falda Pañuelo", desc: "Trazado del cuarto de falda a partir del radio de cintura, con una capa por cada largo que quieras superponer.", embebido: "falda_panuelo_interactivo.html", color: "#488164" },

    // La sexta no lleva herramienta: en vez de embeber un trazador, ofrece las
    // fichas en papel donde se anotan las medidas del cliente. Por eso trae
    // "descargas" donde las otras traen "embebido", y abrirOpcion mira cuál de
    // las dos tiene para saber qué enseñar.
    //
    // La lista va escrita a mano, y no puede ser de otra manera: esto es una web
    // estática, sin servidor al que preguntarle qué hay dentro de la carpeta. Si
    // algún día se añade una ficha a toma_medidas/, hay que añadirla aquí.
    "6": {
      slug: "fichas",
      titulo: "Ficha toma de medidas",
      desc: "Las hojas en blanco donde se anotan las medidas del cliente. Descárgalas e imprímelas en A4.",
      color: "#4a4a4a",
      descargas: [
        { archivo: "toma_medidas/general.pdf",  nombre: "General",  detalle: "Todas las medidas", peso: "520 KB" },
        { archivo: "toma_medidas/falda.pdf",    nombre: "Falda",    detalle: "Cintura, cadera, rodilla y largo", peso: "516 KB" },
        { archivo: "toma_medidas/cuerpo.pdf",   nombre: "Cuerpo",   detalle: "Talle, pecho, hombro, sisa y manga", peso: "518 KB" },
        { archivo: "toma_medidas/vestido.pdf",  nombre: "Vestido",  detalle: "Las del cuerpo, más cintura y cadera", peso: "519 KB" },
        { archivo: "toma_medidas/pantalon.pdf", nombre: "Pantalón", detalle: "Cintura, cadera, tiro, rodilla y tobillo", peso: "517 KB" },
        { archivo: "toma_medidas/completo.pdf", nombre: "Las cinco juntas", detalle: "El cuaderno entero, para imprimirlo de una vez", peso: "546 KB" }
      ]
    }
  };

  var modal = document.getElementById('opcion-modal');
  var modalTituloTexto = document.getElementById('modal-titulo-texto');
  var modalIcono = document.getElementById('modal-icono');
  var modalDesc = document.getElementById('modal-desc');
  var iframeWrap = document.getElementById('iframe-wrap');
  var modalIframe = document.getElementById('modal-iframe');
  var iframeLoading = document.getElementById('iframe-loading');
  var fichasLista = document.getElementById('fichas-lista');
  var lastFocused = null;

  // Rellena la ventana con un enlace de descarga por ficha. Se construye con
  // createElement y textContent, nunca con innerHTML: los nombres salen de la
  // tabla de aquí arriba, pero pegarlos como HTML sería sembrar un agujero para
  // el día en que alguno venga de otro sitio.
  function pintarDescargas(datos){
    fichasLista.textContent = '';
    datos.descargas.forEach(function(f){
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'ficha-btn';
      a.href = f.archivo;
      // El atributo "download" es lo que convierte el enlace en una descarga en
      // vez de abrir el PDF en el visor del navegador. El nombre del archivo se
      // deja tal cual: es corto y ya dice qué es.
      a.setAttribute('download', '');
      // Los lectores de pantalla anuncian el enlace entero de un tirón, así que
      // el texto accesible dice qué hace, no solo cómo se llama.
      a.setAttribute('aria-label', 'Descargar la ficha de ' + f.nombre + ' en PDF, ' + f.peso);

      var nom = document.createElement('span');
      nom.className = 'ficha-nombre';
      nom.textContent = f.nombre;

      var det = document.createElement('span');
      det.className = 'ficha-detalle';
      det.textContent = f.detalle;

      // El peso va aparte y a la derecha: quien abre esto desde el móvil con
      // datos quiere saber qué se va a descargar antes de tocarlo.
      var peso = document.createElement('span');
      peso.className = 'ficha-peso';
      peso.textContent = f.peso;

      a.appendChild(nom);
      a.appendChild(det);
      a.appendChild(peso);
      li.appendChild(a);
      fichasLista.appendChild(li);
    });
  }

  function abrirOpcion(id){
    var datos = OPCIONES[id];
    if (!datos) return;
    modalTituloTexto.textContent = datos.titulo;
    modalDesc.textContent = datos.desc;

    // El icono se clona del propio botón en vez de repetir el trazado en esta
    // tabla: así cada opción arrastra el suyo sin que puedan separarse. Se le
    // quita la clase tag-icon, que lleva el trazo blanco y el tamaño fijo
    // pensados para el disco del botón.
    // La opción de las fichas no tiene icono, y entonces el hueco se queda
    // vacío: .titulo-icono:empty lo esconde y el título va solo.
    modalIcono.innerHTML = '';
    var origen = document.querySelector('.tag-btn[data-opcion="' + id + '"] .tag-icon');
    if (origen) {
      var clon = origen.cloneNode(true);
      clon.removeAttribute('class');
      modalIcono.appendChild(clon);
    }

    // Dos ventanas distintas con el mismo diálogo: así el cerrar, la tecla Esc,
    // el clic en el fondo, la devolución del foco y el borrado del parámetro de
    // la URL valen para las dos sin escribirlos dos veces.
    var conHerramienta = !!datos.embebido;
    iframeWrap.hidden = !conHerramienta;
    fichasLista.hidden = conHerramienta;
    // Ancha solo cuando lleva herramienta: la lista de fichas en 70rem dejaría
    // seis renglones perdidos en una sábana de papel.
    modal.classList.toggle("modal-wide", conHerramienta);

    if (conHerramienta) {
      // La herramienta embebida se carga una sola vez y se mantiene viva aunque se cierre
      // el modal: reabrirla es instantáneo y conserva las medidas que dejó el usuario.
      if (modalIframe.getAttribute("src") !== datos.embebido) {
        iframeLoading.style.display = "flex";
        // El alto de la herramienta anterior no vale para esta.
        altoDeclarado = 0;
        modalIframe.style.height = "";
        modalIframe.src = datos.embebido;
      }
      modalIframe.title = datos.titulo;
    } else {
      pintarDescargas(datos);
    }

    // Cada opción tiñe su botón y la ventana que abre.
    modal.style.setProperty("--color-opcion", datos.color);

    lastFocused = document.activeElement;
    modal.showModal();
  }

  modalIframe.addEventListener('load', function(){
    iframeLoading.style.display = 'none';
  });

  // Cada herramienta dice cuánto mide: abierto desde file:// el documento del
  // iframe es de otro origen y no se puede medir desde aquí. Sin esto haría
  // falta una altura fija, y la que tiene más mandos se corta por abajo.
  // No se comprueba el origen (desde file:// llega como "null"), sino que el
  // mensaje venga de nuestro propio iframe, que sí es comprobable.
  var ALTO_MINIMO = 320;
  var AIRE_DIALOGO = 40;   // lo que el dialog deja arriba y abajo
  var altoDeclarado = 0;
  function ajustarAltoIframe(){
    if (!altoDeclarado) return;
    modalIframe.style.height = altoDeclarado + 'px';
    // El marco del modal (título, descripción y relleno de la tarjeta) se mide,
    // no se estima: con una constante a ojo el hueco salía corto y aparecía una
    // barra de desplazamiento por un solo píxel.
    var card = modal.querySelector('.card');
    var extra = card.getBoundingClientRect().height - iframeWrap.getBoundingClientRect().height;
    var hueco = Math.floor(Math.max(ALTO_MINIMO, window.innerHeight - extra - AIRE_DIALOGO));
    iframeWrap.style.maxHeight = hueco + 'px';
    // El desplazamiento solo se enciende si sobra de verdad. La holgura de 2px
    // evita que un redondeo del navegador saque una barra inútil; recortar dos
    // píxeles no se ve, una barra permanente sí.
    iframeWrap.style.overflowY = (altoDeclarado > hueco + 2) ? 'auto' : 'hidden';
  }
  window.addEventListener('message', function(e){
    if (e.source !== modalIframe.contentWindow) return;
    var d = e.data;
    if (!d || d.tipo !== 'alto-herramienta') return;
    var alto = parseInt(d.alto, 10);
    if (!(alto > 0) || alto > 5000) return;
    altoDeclarado = alto;
    ajustarAltoIframe();
  });
  window.addEventListener('resize', ajustarAltoIframe);
  // Cada botón se tiñe con el color de su opción al arrancar.
  Array.prototype.forEach.call(document.querySelectorAll('.tag-btn'), function(btn){
    var datos = OPCIONES[btn.getAttribute('data-opcion')];
    if (datos && datos.color) btn.style.setProperty('--color-opcion', datos.color);
  });


  document.getElementById('options').addEventListener('click', function(e){
    var btn = e.target.closest('.tag-btn');
    if (!btn) return;
    abrirOpcion(btn.getAttribute('data-opcion'));
  });

  document.getElementById('modal-cerrar').addEventListener('click', function(){
    modal.close();
  });

  modal.addEventListener('click', function(e){
    if (e.target === modal) modal.close();
  });

  modal.addEventListener('close', function(){
    if (lastFocused) lastFocused.focus();
    limpiarURL();
  });


  // Enlace directo a una herramienta. Los codigos QR del taller (img/qr/)
  // apuntan a ?opcion=falda, ?opcion=cuerpo, etc., para dejarte dentro de la
  // calculadora sin pasar por el menu. Se admiten tambien los numeros por si
  // alguien teclea ?opcion=2 a mano; los slugs son lo que va impreso porque se
  // leen, se escriben y sobreviven a que algun dia se reordenen los botones.
  function idDeParametro(valor){
    if (!valor) return null;
    valor = String(valor).toLowerCase();
    if (OPCIONES[valor]) return valor;
    for (var id in OPCIONES) {
      if (OPCIONES[id].slug === valor) return id;
    }
    // Un valor que no corresponda a nada no hace nada: te quedas en la portada,
    // sin error ni ventana a medias.
    return null;
  }

  // Cerrar la ventana borra el parametro, asi cerrar te devuelve de verdad al
  // menu y recargar no vuelve a meterte dentro. Va protegido porque abierto
  // desde file:// esta llamada puede lanzar, y quedarse sin limpiar la barra de
  // direcciones no es motivo para tumbar la pagina.
  function limpiarURL(){
    if (!window.history || !history.replaceState) return;
    if (!window.location.search) return;
    try {
      history.replaceState(null, '', window.location.pathname + window.location.hash);
    } catch (e) {}
  }

  var opcionPedida = idDeParametro(new URLSearchParams(window.location.search).get('opcion'));
  if (opcionPedida) abrirOpcion(opcionPedida);
