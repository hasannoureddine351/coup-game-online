export default function CharacterCard({ src, name }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 md:w-40 h-44 md:h-56 drop-shadow-xl overflow-hidden rounded-[2px]">
        <img
          src={src}
          alt={name}
          className="card-character-window absolute inset-0 w-full h-full object-cover object-top z-0"
        />
        <img
          src="/cardboarder.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />
      </div>
      <p className="font-gothic text-xl md:text-2xl font-bold tracking-wider text-light/90">
        {name}
      </p>
    </div>
  );
}
