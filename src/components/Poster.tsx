interface PosterProps {
  url: string | null;
  titulo: string;
  className?: string;
}

// Muestra el póster o, si TMDB no tiene imagen, un recuadro con el título.
const Poster = ({ url, titulo, className = "" }: PosterProps) =>
  url ? (
    <img src={url} alt={`Póster de ${titulo}`} className={`poster ${className}`} loading="lazy" />
  ) : (
    <div className={`poster poster-vacio ${className}`} role="img" aria-label={`${titulo} sin póster`}>
      <span>{titulo}</span>
    </div>
  );

export default Poster;
