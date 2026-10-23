const COLORES_FRESCAS = ["Amarillo","Crema","Naranja","Rojo","Bordó","Rosado","Fucsia","Verde","Blanco","Salmón"];
const COLORES_SECAS   = [...COLORES_FRESCAS, "Marrón","Beige","Azul","Celeste","Negro"];

const FLORES = {
  estacion: ["Astromelias","Dianthus","Marimonias","Montoneras","Alhelí","Fresias","Conejitos","Lisianthus","Anémonas","Statice","Follajes varios","Aromáticas","Entre otras especies"],
  premium:  ["Rosas","Crisantemos importados","Lillium","Azucenas","Girasoles","Ornithogalum","Cosmos","Calas","Hortensias","Hojas de ampelopsis","Hojas de monstera","Hojas de philodendron","Follajes varios","Aromáticas","Entre otras especies"],
  secas:    ["Amapola","Mohas","Trigo","Avena","Cebada","Alpiste","Falso lino","Lentejilla","Eucalipto","Quina","Entre otras variedades"],
  coronasFrescas: ["Mismos colores y flores que en los ramos de flores frescas"],
  coronasSecas:   ["Mismos colores y flores que en los ramos de flores secas"]
};

const WHATSAPP = "5492610000000";   // número real del Milo (sin + ni espacios)
const NOTA_GENERAL = "Cada pieza se diseña de manera personalizada. Las variedades florales, tonalidades y composición se definen según la propuesta estética acordada y la disponibilidad de flores de temporada.";

// precios de ejemplo
const PRECIOS = {
  XS: { estacion: 15000, premium: 0 },
  S:  { estacion: 20000, premium: 28000 },
  M:  { estacion: 30200, premium: 40000 },
  L:  { estacion: 40000, premium: 52000 },
  XL: { estacion: 52000, premium: 68000 }
};

const PRODUCTOS = {};

// Ramos de flores frescas: Estación en todos los talles, Premium solo de S a XL
["XS","S","M","L","XL"].forEach(t => {
  const variantes = {
    estacion: { etiqueta: "Estación", precio: PRECIOS[t].estacion,
                intro: "Flores de estación, como:", flores: FLORES.estacion }
  };
  if (t !== "XS") {
    variantes.premium = { etiqueta: "Premium", precio: PRECIOS[t].premium,
                intro: "Mix de flores de estación y flores como:", flores: FLORES.premium };
  }
  PRODUCTOS[`fresco-${t.toLowerCase()}`] = {
    nombre: `Ramo de flores frescas - ${t}`,
    colores: COLORES_FRESCAS,
    variantes
  };
});

// Ramos de flores secas: una sola variante (sin elegir calidad)
["XS","S","M","L","XL"].forEach(t => {
  PRODUCTOS[`seco-${t.toLowerCase()}`] = {
    nombre: `Ramo de flores secas - ${t}`,
    colores: COLORES_SECAS,
    variantes: {
      unica: { precio: PRECIOS[t].estacion,
               intro: "Mix de flores secas y preservadas, cuidadosamente seleccionadas, que puede incluir:",
               flores: FLORES.secas }
    }
  };
});

// Coronas
PRODUCTOS["corona-fresca"] = {
  nombre: "Corona de flores frescas", colores: COLORES_FRESCAS,
  variantes: { unica: { precio: 35000, intro: "Corona de flores frescas.", flores: FLORES.coronasFrescas } }
};
PRODUCTOS["corona-seca"] = {
  nombre: "Corona de flores secas", colores: COLORES_SECAS,
  variantes: { unica: { precio: 35000, intro: "Corona de flores secas.", flores: FLORES.coronasSecas } }
};

// Productos que se coordinan por WhatsApp (sin carrito)
[
  ["novia",       "Ramo de novia", 100],
  ["boutonniere", "Boutonniere",   100],
  ["tocados",     "Tocados",       0],
  ["pulseras",    "Pulseras",      0]
].forEach(([id, nombre, precio]) => {
  PRODUCTOS[id] = { nombre, whatsapp: true, precio };
});