// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
// Formatea fechas de forma consistente para las tarjetas y detalles del producto.
export const formatDate = (value: Date) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
