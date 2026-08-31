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

## Las cinco herramientas

| Herramienta | Qué traza |
|---|---|
| **Patrón base de falda** — `falda_base_interactivo.html` | La silueta completa, delantero y trasero, con la regla 50-32-18. |
| **Cuerpo base** — `cuerpo_base_interactivo.html` | El bloque de delantero y espalda, resolviendo el ajuste a la prominencia del pecho y el reparto 25-40-35 en la cintura. |
| **Manga base** — `manga_base_interactivo.html` | La copa y la forma de la manga, en proporción al recorrido de las dos sisas del cuerpo base. |
| **Pantalón base** — `pantalon_base_interactivo.html` | Delantero y espalda sobre el rectángulo de cuarto de cadera, con el avance de tiro sacado de la cadera y el reparto de cintura en costados y pinzas según el tipo de glúteos. |
| **Falda pañuelo** — `falda_panuelo_interactivo.html` | El cuarto de falda a partir del radio de cintura, con una capa por cada largo que quieras superponer. |

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
img/qr/                        Los seis códigos QR, en SVG
qr.html                        La hoja imprimible con los seis códigos
pruebas.html                   El banco de pruebas
```

## Códigos QR

En `img/qr/` hay seis códigos, y **`qr.html`** es la hoja imprimible que los
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

El parámetro `?opcion=` funciona con o sin código de por medio, y también en
local. Acepta el nombre o el número del botón (`?opcion=2` equivale a
`?opcion=cuerpo`); un valor que no exista se ignora y te deja en la portada.
Cerrar la ventana borra el parámetro de la dirección.

## Pruebas

Abre **`pruebas.html`** en el navegador: comprueba la geometría de los cinco
trazados y da el resultado en pantalla. Ahora mismo, **12 741 comprobaciones,
0 fallos**.

## Licencia

GNU General Public License v3 — ver [`LICENSE`](LICENSE).
