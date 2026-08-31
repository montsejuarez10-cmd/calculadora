/* Ayudantes comunes a las herramientas interactivas (falda, cuerpo, ...).
   Aquí no hay nada de ninguna prenda concreta: sliders, casillas numéricas,
   agrupación de renders y la capa de escala. La geometría vive en cada página.

   Se usa así, al final del script de la herramienta:

     const util = Herramienta.montar({
       svg: svgPatron,
       escala: { capa, razon, barra, tramo },
       cmPorUnidad: ESCALA,
       render: renderizarEsquema,
       medidas: [ [inCintura, numCintura], ... ],
       casillas: [chkMargen]
     });

   y devuelve { actualizarEscala, solicitarRender, pintarTodas }. Las dos
   primeras hay que llamarlas desde el render: actualizarEscala() detrás de
   fijar el viewBox, y capa.style.display para esconderla cuando no hay trazado.
*/
var Herramienta = (function () {
  'use strict';

  var CM_POR_PX_CSS = 2.54 / 96;   // píxel de referencia CSS
  // El gris de deshabilitado es neutro a propósito: no pertenece a la opción.
  var GRIS_LLENO = '#d6d6d6', GRIS_VACIO = '#ededed';

  function leerColor(nombre, reserva) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
    return v || reserva;
  }

  function montar(cfg) {
    var svg = cfg.svg;
    var esc = cfg.escala;
    var cmPorUnidad = cfg.cmPorUnidad;
    var render = cfg.render;

    // Las tramas de las pinzas se generan aquí y no se copian en el <defs> de
    // cada página: son las mismas en las cuatro y así no pueden separarse.
    if (cfg.tramas) {
      var defs = svg.querySelector("defs") || svg.insertBefore(
        document.createElementNS("http://www.w3.org/2000/svg", "defs"), svg.firstChild);
      defs.insertAdjacentHTML("afterbegin", defsTramas(cfg.tramas));
    }

    // Los colores salen de css/herramienta.css, no se repiten aquí.
    var LLENO = leerColor('--color-herramienta', '#e86868');
    var VACIO = leerColor('--pista-vacia', '#f6dede');

    // ---- Escala a la que se está viendo el trazado -----------------------
    // cmPorUnidad es fija; lo que varía es el factor con el que el navegador
    // acaba pintando el viewBox dentro del hueco disponible.
    function actualizarEscala() {
      var vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
      var anchoVb = vb[2], altoVb = vb[3];
      var caja = svg.getBoundingClientRect();
      if (!caja.width || !anchoVb || !altoVb) return;

      // preserveAspectRatio es "meet" por defecto: manda la razón MENOR.
      var k = Math.min(caja.width / anchoVb, caja.height / altoVb);
      var pxPorCm = cmPorUnidad * k;

      // La razón es nominal: sale del píxel de referencia CSS de 96 ppp. La
      // barra, en cambio, se mide contra el propio trazado y siempre es exacta.
      var razon = 1 / (pxPorCm * CM_POR_PX_CSS);
      esc.razon.textContent = 'Escala 1:' + razon.toFixed(1).replace('.', ',');

      // A 10 cm la barra se comería media ventana en los patrones cortos.
      var tramo = (10 * pxPorCm > caja.width * 0.4) ? 5 : 10;
      esc.barra.style.width = (tramo * pxPorCm) + 'px';
      esc.tramo.textContent = tramo + ' cm';
    }

    // ---- Alto que necesita la herramienta ---------------------------------
    // El modal la mete en un iframe y no puede medirla: abierto desde file://
    // el documento de dentro es de otro origen para el padre. Se lo decimos por
    // postMessage, que sí cruza. Sin esto el iframe tiene un alto fijo y la
    // herramienta con más mandos se corta por abajo.
    var altoAvisado = 0;
    function avisarAlto() {
      if (window.parent === window) return;
      // scrollHeight no sirve para encoger: dentro del modal el html va con
      // overflow:hidden y devuelve el alto del propio marco cuando la
      // herramienta es más corta, así que el modal se quedaba con el alto de
      // reserva y dejaba un hueco muerto debajo. Se mide el final real del
      // contenido —el final de la caja de la herramienta— y solo se recurre a
      // scrollHeight si no hay caja que medir.
      var caja = document.querySelector('.contenedor');
      // SOMBRA: solo lo justo para que no se corte la sombra de la caja. Antes
      // se sumaba el relleno entero del body, que junto con el de la tarjeta
      // del modal dejaba abajo más margen que arriba.
      var SOMBRA = 8;
      var alto = caja
        ? Math.ceil(caja.getBoundingClientRect().bottom + window.scrollY + SOMBRA)
        : Math.ceil(document.documentElement.scrollHeight);
      if (Math.abs(alto - altoAvisado) < 2) return;
      altoAvisado = alto;
      window.parent.postMessage({ tipo: 'alto-herramienta', alto: alto }, '*');
    }

    // ---- Un render por fotograma como mucho ------------------------------
    // Los sliders emiten decenas de eventos 'input' por segundo y cada render
    // rehace todo el trazado.
    var renderPendiente = false;
    function solicitarRender() {
      if (renderPendiente) return;
      renderPendiente = true;
      requestAnimationFrame(function () {
        renderPendiente = false;
        render();
        avisarAlto();
      });
    }

    // ---- Pista de los sliders --------------------------------------------
    // Chrome no rellena la pista por su cuenta cuando se le quita la
    // apariencia nativa, así que el tramo recorrido se pinta como degradado de
    // dos paradas.
    var sliders = cfg.medidas.map(function (par) { return par[0]; });
    function pintarPista(slider) {
      var min = parseFloat(slider.min), max = parseFloat(slider.max);
      var pct = max > min ? ((parseFloat(slider.value) - min) / (max - min)) * 100 : 0;
      var lleno = slider.disabled ? GRIS_LLENO : LLENO;
      var vacio = slider.disabled ? GRIS_VACIO : VACIO;
      slider.style.setProperty('--pulsador', lleno);
      slider.style.setProperty('--vacio', vacio);
      slider.style.setProperty('--pista',
        'linear-gradient(to right, ' + lleno + ' ' + pct + '%, ' + vacio + ' ' + pct + '%)');
    }
    function pintarTodas() { sliders.forEach(pintarPista); }

    // ---- Aplicar y guardar las medidas -----------------------------------
    // Los valores por defecto son los que trae el HTML; se apuntan antes de
    // pisarlos con lo guardado, para poder volver a ellos.
    var porDefecto = {};
    sliders.forEach(function (s) { porDefecto[s.id] = s.value; });

    function ajustar(slider, valor) {
      var lo = parseFloat(slider.min), hi = parseFloat(slider.max);
      var paso = parseFloat(slider.step) || 1;
      if (!isFinite(valor)) return null;
      // Se recorta al rango del mando y se ajusta a su paso: una sisa que el
      // cuerpo calcule en 26,3 no cabe en un mando que llega a 26.
      var v = Math.min(hi, Math.max(lo, valor));
      return String(Math.round(v / paso) * paso);
    }

    function aplicarGuardadas() {
      var g = leerTodo();
      var mias = g.prendas[cfg.nombre] || {};
      sliders.forEach(function (s) {
        var n = nombreMedida(s);
        var v = DEL_CUERPO[n] ? g.cuerpo[n] : mias[n];
        var ajustado = ajustar(s, v);
        if (ajustado !== null) s.value = ajustado;
      });
      cfg.medidas.forEach(function (par) { reflejar(par[1], par[0].value); });
    }

    function guardarMedidas() {
      var g = leerTodo();
      var mias = g.prendas[cfg.nombre] || (g.prendas[cfg.nombre] = {});
      sliders.forEach(function (s) {
        var n = nombreMedida(s);
        if (DEL_CUERPO[n]) g.cuerpo[n] = parseFloat(s.value);
        else mias[n] = parseFloat(s.value);
      });
      escribirTodo(g);
    }

    // Volver a los valores por defecto. Solo aparece cuando hay algo que
    // deshacer: si nada se ha movido, el botón sobra.
    var botonDefecto = null;
    function crearBotonDefecto() {
      if (!cfg.nombre) return;
      var caja = document.querySelector('.controles');
      var informe = caja && caja.querySelector('.reporte-tecnico');
      if (!caja) return;
      botonDefecto = document.createElement('button');
      botonDefecto.type = 'button';
      botonDefecto.className = 'volver-defecto';
      botonDefecto.textContent = 'Volver a las medidas por defecto';
      botonDefecto.addEventListener('click', function () {
        sliders.forEach(function (s) { s.value = porDefecto[s.id]; });
        cfg.medidas.forEach(function (par) { reflejar(par[1], par[0].value); });
        guardarMedidas();
        pintarTodas();
        actualizarBotonDefecto();
        solicitarRender();
      });
      caja.insertBefore(botonDefecto, informe);
      actualizarBotonDefecto();
    }
    function actualizarBotonDefecto() {
      if (!botonDefecto) return;
      var cambiado = sliders.some(function (s) { return s.value !== porDefecto[s.id]; });
      botonDefecto.hidden = !cambiado;
    }

    // ---- Slider y casilla numérica en pareja ------------------------------
    function emparejar(slider, campo) {
      var min = parseFloat(slider.min), max = parseFloat(slider.max);

      slider.addEventListener('input', function () {
        pintarPista(slider);
        guardarMedidas();
        actualizarBotonDefecto();
        solicitarRender();
      });

      // Al teclear NO se recorta en cada pulsación: un 8 camino de 85 se
      // convertiría en el mínimo y ya no dejaría seguir escribiendo. Mientras
      // el número esté fuera de rango o a medias, el plano no se mueve.
      campo.addEventListener('input', function () {
        var v = parseFloat(campo.value);
        if (!Number.isFinite(v) || v < min || v > max) return;
        slider.value = v;
        pintarPista(slider);
        guardarMedidas();
        actualizarBotonDefecto();
        solicitarRender();
      });

      // Al salir del campo ya sí: se recorta, se ajusta al paso del slider y la
      // casilla muestra el valor que de verdad se ha aplicado.
      campo.addEventListener('change', function () {
        var v = parseFloat(campo.value);
        if (!Number.isFinite(v)) v = parseFloat(slider.value);
        slider.value = Math.min(max, Math.max(min, v));
        campo.value = slider.value;
        pintarPista(slider);
        guardarMedidas();
        actualizarBotonDefecto();
        solicitarRender();
      });
    }
    cfg.medidas.forEach(function (par) { emparejar(par[0], par[1]); });
    (cfg.casillas || []).forEach(function (chk) {
      chk.addEventListener('change', solicitarRender);
    });

    // Al cambiar el ancho de la ventana el trazado se reescala sin que haya
    // render, así que la escala hay que recalcularla aparte. Van los dos avisos
    // a propósito: 'resize' cubre el caso corriente y no depende de nada, y el
    // observador coge además lo que cambia de tamaño sin mover la ventana
    // (abrir el modal, el reflujo al terminar de cargar las fuentes). La capa
    // está fuera de flujo y no puede alterar el tamaño del SVG: no hay
    // realimentación.
    function alRedimensionar() { actualizarEscala(); avisarAlto(); }
    window.addEventListener('resize', alRedimensionar);
    if (window.ResizeObserver) {
      new ResizeObserver(actualizarEscala).observe(svg);
      new ResizeObserver(avisarAlto).observe(document.body);
    }
    // Las fuentes cargan aparte y al llegar mueven el ancho de la columna de
    // mandos, que es lo que le deja sitio al trazado.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(alRedimensionar);
    }
    window.addEventListener('load', avisarAlto);

    // Antes de pintar: las medidas guardadas mandan sobre las del HTML.
    if (cfg.nombre) {
      aplicarGuardadas();
      crearBotonDefecto();
    }
    pintarTodas();

    return {
      actualizarEscala: actualizarEscala,
      solicitarRender: solicitarRender,
      pintarTodas: pintarTodas,
      pintarPista: pintarPista,
      avisarAlto: avisarAlto
    };
  }

  // Reflejar el valor del slider en su casilla, salvo mientras se teclea en
  // ella: reescribirla movería el cursor a mitad de un número.
  function reflejar(campo, valor) {
    if (document.activeElement !== campo) campo.value = valor;
  }

  // ---- Las medidas, recordadas y compartidas ------------------------------
  // Dos problemas de una vez. Uno: al recargar se perdía todo y había que
  // volver a poner las nueve medidas a mano. Y dos, peor: el contorno de
  // cintura de la falda y el del pantalón eran dos números distintos, así que
  // el mismo cuerpo salía con dos patrones que no casaban.
  //
  // Las medidas del CUERPO —cintura, cadera, pecho, las dos sisas— se guardan
  // en un solo sitio y las leen las cuatro herramientas. Las de la PRENDA
  // —el largo de la falda, el puño de la manga— se guardan aparte por
  // herramienta: "largo" no significa lo mismo en una falda que en un pantalón.
  var CLAVE = 'taller.medidas';
  var DEL_CUERPO = {
    Cintura: 1, Cadera: 1, AltCadera: 1, Pecho: 1, SisaDel: 1, SisaEsp: 1
  };

  // localStorage puede no estar (ventana de incógnito, permisos del navegador),
  // y en file:// algunos navegadores lo capan. Nunca debe impedir dibujar.
  function almacen() {
    try {
      var s = window.localStorage;
      s.setItem('taller.prueba', '1');
      s.removeItem('taller.prueba');
      return s;
    } catch (e) { return null; }
  }
  function leerTodo() {
    var s = almacen();
    if (!s) return { cuerpo: {}, prendas: {} };
    try {
      var g = JSON.parse(s.getItem(CLAVE) || '{}');
      return { cuerpo: g.cuerpo || {}, prendas: g.prendas || {} };
    } catch (e) { return { cuerpo: {}, prendas: {} }; }
  }
  function escribirTodo(g) {
    var s = almacen();
    if (!s) return;
    try { s.setItem(CLAVE, JSON.stringify(g)); } catch (e) {}
  }

  // El nombre de la medida es el id del slider sin el "in": inCintura -> Cintura.
  function nombreMedida(slider) { return slider.id.replace(/^in/, ''); }

  // Guardar una medida ya calculada por la herramienta, no movida por un mando:
  // así el cuerpo le pasa a la manga cuánto miden sus dos sisas, que es de donde
  // sale la copa. Antes había que medirlas a mano y teclearlas.
  function publicarMedida(nombre, valor) {
    if (!DEL_CUERPO[nombre] || !isFinite(valor)) return;
    var g = leerTodo();
    if (g.cuerpo[nombre] === valor) return;   // no reescribir en cada fotograma
    g.cuerpo[nombre] = valor;
    escribirTodo(g);
  }

  // ---- Geometría de las pinzas -------------------------------------------
  // No hay nada de ninguna prenda aquí: una pinza es una cuña que se retira
  // apuntando a un punto de volumen —el pecho, el omóplato, la cadera—, y eso
  // es igual en las cuatro herramientas.

  function girar(p, centro, a) {
    var dx = p.x - centro.x, dy = p.y - centro.y;
    return {
      x: centro.x + dx * Math.cos(a) - dy * Math.sin(a),
      y: centro.y + dx * Math.sin(a) + dy * Math.cos(a)
    };
  }

  // Las dos patas de una pinza tienen que medir lo mismo para que cierre, y su
  // eje tiene que caer en medio. Se construye desde el punto donde el eje corta
  // el borde y se gira medio ángulo a cada lado: sale simétrica por
  // construcción, sin depender de por dónde ande el borde.
  //
  // La profundidad es lo que separa las dos patas medido en recto, o sea la
  // CUERDA. Tomar el arco (ang = profundidad/largo) la deja hasta 3 mm corta en
  // las pinzas grandes con la pata corta.
  //
  // Devuelve null cuando no cabe: la pinza sería más ancha que el doble de su
  // propia pata. Quien llama decide qué decirle al usuario.
  function abrirPinza(pBorde, punto, retranqueo, profundidad) {
    var dx = pBorde.x - punto.x, dy = pBorde.y - punto.y;
    var bruto = Math.hypot(dx, dy);
    // El vértice se retranquea del punto de volumen: clavado en él la pinza
    // parte la pieza de lado a lado y saca un cono.
    var vertice = { x: punto.x + dx / bruto * retranqueo, y: punto.y + dy / bruto * retranqueo };
    var largoPata = bruto - retranqueo;
    var senoMitad = profundidad / (2 * largoPata);
    if (largoPata <= 1 || senoMitad >= 1) return null;
    var ang = 2 * Math.asin(senoMitad);
    return {
      vertice: vertice, largoPata: largoPata, ang: ang,
      patas: [girar(pBorde, vertice, -ang / 2), girar(pBorde, vertice, ang / 2)]
    };
  }

  // ---- Bézier cúbicas -----------------------------------------------------
  // P son los cuatro puntos: arranque, dos controles y final.
  function enBezier(P, t) {
    var s = 1 - t;
    return {
      x: s*s*s*P[0].x + 3*s*s*t*P[1].x + 3*s*t*t*P[2].x + t*t*t*P[3].x,
      y: s*s*s*P[0].y + 3*s*s*t*P[1].y + 3*s*t*t*P[2].y + t*t*t*P[3].y
    };
  }
  // De Casteljau: parte la cúbica en t y devuelve los dos trozos, cada uno como
  // su propia cúbica. Así se puede recortar una pinza en mitad de una curva —la
  // pinza de sisa del cuerpo— sin deformar el resto del trazado.
  function partirBezier(P, t) {
    function l(a, b) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
    var q0 = l(P[0], P[1]), q1 = l(P[1], P[2]), q2 = l(P[2], P[3]);
    var r0 = l(q0, q1), r1 = l(q1, q2);
    var s = l(r0, r1);
    return [[P[0], q0, r0, s], [s, r1, q2, P[3]]];
  }
  // Solo las órdenes C, sin el punto de arranque: lo pone quien llama, que es
  // el que sabe si viene de otro tramo.
  function cubica(P) {
    return 'C ' + P[1].x.toFixed(2) + ',' + P[1].y.toFixed(2) + ' '
                + P[2].x.toFixed(2) + ',' + P[2].y.toFixed(2) + ' '
                + P[3].x.toFixed(2) + ',' + P[3].y.toFixed(2) + ' ';
  }

  // ---- Tramas de las pinzas ----------------------------------------------
  // El mismo código de color en las cuatro herramientas: rojo lo que se mete
  // por el costado, azul la pinza principal de cada pieza, verde la secundaria,
  // naranja lo que se lleva el volumen del pecho y morado la segunda pinza que
  // también apunta a él. Estaban copiadas a mano en el <defs> de cada página, y
  // así no pueden separarse.
  //
  // La trama es de 4 unidades (2/3 de cm) para que incluso una pinza de 1 cm
  // muestre varios puntos.
  var COLOR_TRAMA = {
    costado: '#e05a4d',
    principal: '#3e7bb8',
    secundaria: '#4f9e62',
    pecho: '#e8952f',
    ce: '#e8952f',
    sisa: '#8e6bbf'
  };
  function defsTramas(nombres) {
    return nombres.map(function (n) {
      var c = COLOR_TRAMA[n];
      return '<pattern id="pts-' + n + '" width="4" height="4" patternUnits="userSpaceOnUse">'
        + '<circle cx="1" cy="1" r="0.9" fill="' + c + '" />'
        + '<circle cx="3" cy="3" r="0.9" fill="' + c + '" /></pattern>';
    }).join('');
  }

  // ---- Piezas del dibujo --------------------------------------------------
  // La superficie que se retira (una pinza, lo que entra por el costado) se
  // dibuja como una forma aparte por debajo de la silueta, para no ensuciar su
  // contorno con el relleno.
  function trama(id, d) {
    return '<path d="' + d + '" class="relleno" fill="url(#' + id + ')" />';
  }

  // Resumen bajo cada pieza: un cuadrado con la misma trama que lleva la pinza
  // en el plano y su tamaño en cm. Solo se lista lo que se ha dibujado, así el
  // resumen y el trazado no pueden contradecirse.
  //
  // Una entrada es { nombre, cm, trama } o { nombre, cm, color } para las cotas
  // que van de un color plano y no de una trama.
  // medidas: { lado, paso, hueco } — el pantalón las quiere mayores, porque se
  // dibuja a 1:10 y con los cuerpos de las otras tres no se leería.
  function leyenda(entradas, yBase, medidas) {
    var m = medidas || {};
    var lado = m.lado || 15, paso = m.paso || 22, hueco = m.hueco || 26;
    return entradas.filter(function (e) { return e.cm > 0.001; }).map(function (e, i) {
      var y = yBase + hueco + i * paso;
      var relleno = e.trama ? 'url(#' + e.trama + ')' : e.color;
      return '<rect x="0" y="' + y.toFixed(2) + '" width="' + lado + '" height="' + lado
        + '" class="muestra" fill="' + relleno + '" />'
        + '<text x="' + (lado + 7) + '" y="' + (y + lado - 2).toFixed(2) + '" class="leyenda">'
        + e.nombre + ': ' + cm(e.cm) + ' cm</text>';
    }).join('');
  }

  // ---- El informe ---------------------------------------------------------
  // Una fila por dato: concepto a la izquierda y cifra alineada a la derecha,
  // agrupadas en bloques con rótulo. La marca y el reparto en columnas están en
  // css/herramienta.css.
  function cm(x) { return x.toFixed(1).replace('.', ','); }
  function fila(rotulo, valor, detalle) {
    return '<div class="fila' + (detalle ? ' detalle' : '') + '">'
      + '<span>' + rotulo + '</span><b>' + valor + '</b></div>';
  }
  function bloque(titulo, filas) {
    return '<div class="grupo"><h4>' + titulo + '</h4>' + filas.join('') + '</div>';
  }
  // Los avisos cruzan los bloques a todo lo ancho: son excepciones del método,
  // no un dato más.
  function informe(bloques, notas) {
    return '<div class="grupos">' + bloques.join('')
      + (notas || []).map(function (t) { return '<div class="nota">' + t + '</div>'; }).join('')
      + '</div>';
  }

  // ---- Un trazado que falla tiene que decirlo -----------------------------
  // Sin esto, un error en el render deja en pantalla el dibujo anterior y ni un
  // aviso: la herramienta parece que va, pero no responde a los mandos. Pasó al
  // chocar dos const en la falda, y la página se quedó en blanco sin más.
  function blindar(render, partes) {
    return function () {
      try {
        return render.apply(null, arguments);
      } catch (e) {
        if (window.console && console.error) console.error(e);
        partes.aviso.textContent =
          '⚠ Algo ha fallado al trazar el patrón. Es un fallo del programa, no de '
          + 'tus medidas; el detalle está en la consola del navegador.';
        partes.aviso.style.display = 'block';
        partes.capa.innerHTML = '';
        if (partes.escala) partes.escala.style.display = 'none';
        if (partes.informe) partes.informe.textContent = 'No se ha podido calcular.';
      }
    };
  }

  // ---- Nombre del dibujo -------------------------------------------------
  // Todo lo que produce la herramienta es un SVG, y un SVG sin <title> no
  // existe para quien no lo ve: un lector de pantalla se lo salta entero. El
  // título dice qué pieza es y para qué medidas; la descripción, lo que lleva
  // dibujado. Los dos se rehacen en cada trazado, porque los dos cambian.
  //
  // El detalle numérico no se repite aquí: el informe ya lo tiene, y el SVG lo
  // referencia con aria-describedby desde la propia página.
  function describir(svg, titulo, descripcion) {
    var t = svg.querySelector(':scope > title');
    var d = svg.querySelector(':scope > desc');
    if (t) t.textContent = titulo;
    if (d) d.textContent = descripcion;
  }

  // ---- Rótulo girado sobre una línea vertical ----------------------------
  // Los rótulos de costado y de centro van girados -90 y pegados a su línea. Con
  // ese giro la caja del texto NO crece a los dos lados por igual del punto:
  // hacia un lado llega el alto de las mayúsculas y hacia el otro solo el de los
  // rabos de las letras. Anclando la línea de base con un desplazamiento fijo
  // —como se hacía— "Centro Delantero" quedaba a 9px de su línea y "Costado" a
  // 21px de la suya, y se veía descuadrado.
  //
  // Se ancla el BORDE de la caja con dominant-baseline, que es lo que de verdad
  // se ve, y así todos guardan la misma distancia sea cual sea la fuente:
  //
  //   haciaDerecha = true   -> la caja crece hacia la DERECHA del punto
  //   haciaDerecha = false  -> hacia la IZQUIERDA
  //
  // x,y es el punto de anclaje, ya separado de la línea lo que se quiera.
  // opciones: { clase, centrado } — 'centrado' reparte el texto a lo alto en
  // vez de arrancarlo en y.
  function girado(x, y, texto, haciaDerecha, opciones) {
    var o = opciones || {};
    var px = x.toFixed(2), py = y.toFixed(2);
    return '<text x="' + px + '" y="' + py + '" class="' + (o.clase || 'texto') + '"'
      + ' dominant-baseline="' + (haciaDerecha ? 'text-before-edge' : 'text-after-edge') + '"'
      + (o.centrado ? ' text-anchor="middle"' : '')
      + ' transform="rotate(-90, ' + px + ', ' + py + ')">' + texto + '</text>';
  }

  // El hueco entre la línea y su rótulo. Es HUECO salvo que los dos rótulos de
  // una pieza no quepan a esa distancia —una pieza estrecha, un tobillo fino—;
  // entonces se recorta lo justo, y el mismo valor recortado se usa en TODOS
  // para que sigan guardando la misma distancia entre ellos.
  //   ancho: el de la pieza más angosta, en unidades del lienzo
  var HUECO_ROTULO = 14;   // lo que se separa un rótulo de su línea
  var ALTO_ROTULO = 26;    // lo que ocupa a lo ancho un texto girado
  var AIRE_ROTULOS = 8;    // aire mínimo entre los dos rótulos de una pieza
  function huecoRotulo(ancho) {
    return Math.max(2, Math.min(HUECO_ROTULO,
      (ancho - 2 * ALTO_ROTULO - AIRE_ROTULOS) / 2));
  }

  // ---- Curva que pasa por unos puntos dados ------------------------------
  // La usan la copa de la manga y las costuras de la pierna del pantalón: en
  // los dos casos el método da puntos concretos —los cuartos del tejado, la
  // rodilla y el bajo— y la curva tiene que pasar EXACTAMENTE por ellos, no
  // aproximarlos. Eso es una spline interpolante, no las Bézier colocadas a
  // ojo de la falda y el cuerpo.
  //
  // Catmull-Rom centrípeta (alpha = 0,5): interpola todos los puntos, no se
  // dispara cuando el espaciado es desigual y se convierte a Bézier cúbica sin
  // pérdida, así que sale un atributo d normal y corriente.
  //
  // tangenteInicio y tangenteFin son vectores unitarios opcionales, para
  // forzar por dónde entra o sale la curva (la copa sale horizontal del pico,
  // para que las dos mitades no se encuentren en punta). Fijan la dirección en
  // los extremos; no mueven ninguno de los puntos.
  //
  // Devuelve solo las órdenes C, sin el M inicial: el primer punto lo pone
  // quien llama, que es el que sabe si viene de otro tramo.
  function spline(pts, tangenteInicio, tangenteFin) {
    var n = pts.length, i;
    // Nudos centrípetos: la raíz de la distancia entre puntos consecutivos.
    var t = [0];
    for (i = 1; i < n; i++) {
      var paso = Math.sqrt(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      t.push(t[i - 1] + (paso > 1e-6 ? paso : 1e-6));
    }

    var T = new Array(n);
    for (i = 1; i < n - 1; i++) {
      var d0 = t[i] - t[i - 1], d1 = t[i + 1] - t[i];
      var total = t[i + 1] - t[i - 1];
      T[i] = {
        x: ((pts[i + 1].x - pts[i].x) / d1) * (d0 / total) + ((pts[i].x - pts[i - 1].x) / d0) * (d1 / total),
        y: ((pts[i + 1].y - pts[i].y) / d1) * (d0 / total) + ((pts[i].y - pts[i - 1].y) / d0) * (d1 / total)
      };
    }
    // Extremos. Con tangente dada se respeta su dirección y se le pone la
    // velocidad de la cuerda contigua; sin ella, la propia cuerda.
    function extremo(iP, iQ, dir) {
      var dt = Math.abs(t[iQ] - t[iP]) || 1e-6;
      if (!dir) return { x: (pts[iQ].x - pts[iP].x) / dt, y: (pts[iQ].y - pts[iP].y) / dt };
      var cuerda = Math.hypot(pts[iQ].x - pts[iP].x, pts[iQ].y - pts[iP].y);
      return { x: dir.x * cuerda / dt, y: dir.y * cuerda / dt };
    }
    T[0] = extremo(0, 1, tangenteInicio);
    T[n - 1] = extremo(n - 2, n - 1, tangenteFin);

    var d = '';
    for (i = 0; i < n - 1; i++) {
      var dt2 = t[i + 1] - t[i];
      var c1 = { x: pts[i].x + T[i].x * dt2 / 3, y: pts[i].y + T[i].y * dt2 / 3 };
      var c2 = { x: pts[i + 1].x - T[i + 1].x * dt2 / 3, y: pts[i + 1].y - T[i + 1].y * dt2 / 3 };
      d += 'C ' + c1.x.toFixed(2) + ',' + c1.y.toFixed(2) + ' '
                + c2.x.toFixed(2) + ',' + c2.y.toFixed(2) + ' '
                + pts[i + 1].x.toFixed(2) + ',' + pts[i + 1].y.toFixed(2) + ' ';
    }
    return d;
  }

  return {
    montar: montar, reflejar: reflejar, spline: spline,
    girado: girado, huecoRotulo: huecoRotulo, describir: describir,
    cm: cm, fila: fila, bloque: bloque, informe: informe,
    trama: trama, leyenda: leyenda, blindar: blindar,
    girar: girar, abrirPinza: abrirPinza,
    enBezier: enBezier, partirBezier: partirBezier, cubica: cubica,
    publicarMedida: publicarMedida
  };
})();
