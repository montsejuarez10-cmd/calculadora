# Calculadora de patronaje

Cinco herramientas de cálculo para el proceso de patronaje: introduces las
medidas y cada una traza el patrón, a escala y acotado, en el propio navegador.

## Cómo se usa

Abre **`index.html`** haciendo doble clic. Nada más.

No hay servidor, ni instalación, ni dependencias: todo es HTML, CSS y
JavaScript sin librerías, pensado para funcionar desde `file://`. Se puede
copiar la carpeta a un pendrive y llevársela al taller.

Desde la portada, cada botón despliega su calculadora en una ventana modal.
Cada herramienta es también una página autónoma, así que se puede abrir suelta
si solo te interesa una.

Aparte de las cinco, hay un sexto botón, **Ficha de medidas**, que no traza
nada: abre las hojas en blanco donde se anotan las medidas del cliente, para
descargarlas e imprimirlas.

## Las cinco herramientas

| Herramienta | Qué traza |
|---|---|
| **Falda Base** — `falda_base_interactivo.html` | La silueta completa, delantero y trasero, con la regla 50-32-18. |
| **Cuerpo Base** — `cuerpo_base_interactivo.html` | El bloque de delantero y espalda, resolviendo el ajuste a la prominencia del pecho y el reparto 25-40-35 en la cintura. |
| **Manga Base** — `manga_base_interactivo.html` | La copa y la forma de la manga, en proporción al recorrido de las dos sisas del cuerpo base. |
| **Pantalón Base** — `pantalon_base_interactivo.html` | Delantero y espalda sobre el rectángulo de cuarto de cadera, con el avance de tiro sacado de la cadera y el reparto de cintura en costados y pinzas según el tipo de glúteos. |
| **Falda Pañuelo** — `falda_panuelo_interactivo.html` | El cuarto de falda a partir del radio de cintura, con una capa por cada largo que quieras superponer. |

## Las fichas de toma de medidas

En `toma_medidas/` están las hojas en blanco donde se anotan las medidas del
cliente, en PDF y listas para imprimir en A4. El botón **Ficha de medidas** de
la portada las ofrece todas para descargar.

| ficha | qué pide |
|---|---|
| `general.pdf` | Las diecinueve medidas. Es la hoja de la que las otras cuatro son recortes. |
| `falda.pdf` | Cintura, cadera, altura de cadera y de rodilla, y largo. |
| `cuerpo.pdf` | Talle, pecho, hombro, sisa y manga. |
| `vestido.pdf` | Las del cuerpo, más cintura, cadera y largo. |
| `pantalon.pdf` | Cintura, cadera, tiro, rodilla, tobillo y largo de pierna. |
| `completo.pdf` | Las cinco en un solo archivo, para imprimirlas de una vez. |

Las cinco sueltas salieron de `completo.pdf`. Los seis pesan unos 520 KB cada
uno: los PDF venían de Illustrator con su bloque de datos privados de edición
dentro —unos 2 MB por archivo que no se imprimen nunca— y se les ha quitado.
El trazado no se ha tocado: las páginas renderizadas salen byte a byte iguales
que antes.

## Estructura

```
index.html                     La portada
*_interactivo.html             Las cinco herramientas, cada una autónoma
css/styles.css                 La portada
css/herramienta.css            Las herramientas
css/fonts.css                  Las fuentes, empotradas como data URI
js/app.js                      El menú y la ventana modal
js/herramienta.js              El motor común de trazado
img/                           La ilustración del desfile y el maniquí
img/qr/                        Los siete códigos QR, en SVG
toma_medidas/                  Las fichas de toma de medidas, en PDF
qr.html                        La hoja imprimible con los siete códigos
pruebas.html                   El banco de pruebas
```

## Códigos QR

En `img/qr/` hay siete códigos, y **`qr.html`** es la hoja imprimible que los
presenta con su nombre y su dirección, lista para un A4. La idea es recortarlos
y pegarlos donde se usan: apuntas con la cámara del móvil y entras directamente
en la calculadora que necesitas, sin pasar por el menú.

Apuntan a la copia publicada en GitHub Pages —
<https://montsejuarez10-cmd.github.io/calculadora/> — porque un móvil no puede
abrir un `file:///`.

| código | abre |
|---|---|
| `qr-inicio.svg` | la portada, sin más |
| `qr-falda.svg` | `?opcion=falda` |
| `qr-cuerpo.svg` | `?opcion=cuerpo` |
| `qr-manga.svg` | `?opcion=manga` |
| `qr-pantalon.svg` | `?opcion=pantalon` |
| `qr-panuelo.svg` | `?opcion=panuelo` |
| `qr-fichas.svg` | `?opcion=fichas` |

El parámetro `?opcion=` funciona con o sin código de por medio, y también en
local. Acepta el nombre o el número del botón (`?opcion=2` equivale a
`?opcion=cuerpo`); un valor que no exista se ignora y te deja en la portada.
Cerrar la ventana borra el parámetro de la dirección.

Los siete SVG se generaron una sola vez con una utilidad aparte y se comprobaron
descodificándolos con otra librería distinta. En la web son archivos estáticos:
no llevan código ni dependencias.

## Pruebas

Abre **`pruebas.html`** en el navegador: comprueba la geometría de los cinco
trazados y da el resultado en pantalla. Ahora mismo, **12 741 comprobaciones,
0 fallos**.

## Cómo está hecho

La intención era que esto funcione en cualquier parte: cualquier sistema
operativo, cualquier navegador razonablemente reciente, un portátil viejo o el
móvil que lleves en el bolsillo del delantal. Para eso, cuanto menos lleve
encima, mejor.

Solo hay tres lenguajes, los tres nativos del navegador:

- **HTML** para el marcado del contenido.
- **CSS** para la presentación: color, tipografía, medidas, impresión.
- **JavaScript** para la lógica, sin ningún framework ni librería.

Los patrones se dibujan en **SVG**, que el navegador entiende de fábrica. El
JavaScript escribe directamente las líneas, los arcos y las cotas, sin ninguna
librería de gráficos por medio; por eso el trazado sale nítido a cualquier
tamaño y se imprime sin pixelarse.

No hay framework por una razón concreta: un framework trae un paso de
compilación, y un paso de compilación rompe lo que más importa aquí, que es
poder abrir `index.html` con doble clic. Tampoco hay nada que se pida por
internet —ni una fuente, ni un icono, ni una estadística—. Las dos tipografías,
Fraunces e Inter, van incrustadas en base64 dentro de `css/fonts.css`, porque un
`.woff2` externo no llega a cargarse desde `file://`. El resultado es que la
calculadora funciona sin conexión y no manda datos a ningún sitio. La
aplicación en sí ocupa poco más de medio megabyte; lo que abulta son las fichas
en PDF de `toma_medidas/`, que son 3 MB y solo se descargan si alguien las pide.

### Con qué se ha construido

| | |
|---|---|
| **Claude Code** | Asistente de IA, como pareja de programación. |
| **Visual Studio Code** | Editor y gestión del proyecto. |
| **Git** | Control de versiones en local. |
| **GitHub** | Repositorio remoto y copia de seguridad. |
| **GitHub Pages** | Publicación web, gratuita para repositorios públicos. Es la dirección a la que apuntan los códigos QR. |

Nada de esto hace falta para *usar* la calculadora: son las herramientas del
taller, no la prenda.

## Licencia

GNU General Public License v3 — ver [`LICENSE`](LICENSE).
