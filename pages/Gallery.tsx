import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';

type PastEventPhoto = {
  src: string;
  title: string;
  event: string;
  year: string;
};

// Add more past event photos here.
// 1) Put your image files in: public/gallery/
// 2) Add new objects below with src like: '/gallery/your-photo.jpg'
const PAST_EVENT_PHOTOS: PastEventPhoto[] = [
  {
    src: '/clg.png',
    title: 'Campus Highlights',
    event: 'Ranatantra Memories',
    year: '2025',
  },
  {
    src: '/clg.png',
    title: 'Crowd Moments',
    event: 'Cultural Evening',
    year: '2025',
  },
  {
    src: '/clg.png',
    title: 'Stage Energy',
    event: 'DJ Night',
    year: '2025',
  },
  {
    src: '/clg.png',
    title: 'Team Participation',
    event: 'Tech Challenges',
    year: '2024',
  },
  {
    src: '/clg.png',
    title: 'Inauguration Day',
    event: 'Opening Ceremony',
    year: '2024',
  },
  {
    src: '/clg.png',
    title: 'Winning Moments',
    event: 'Prize Distribution',
    year: '2024',
  },
];

const Gallery: React.FC = () => {
  return (
    <div className="min-h-screen bg-darker overflow-hidden">
      <section className="relative py-24 lg:py-28 border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/50 bg-secondary/10 text-secondary text-xs md:text-sm font-bold tracking-widest uppercase">
              <Camera className="w-4 h-4" />
              Past Events Gallery
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-black text-white font-mono leading-tight">
              Relive <span className="text-primary">Ranatantra</span> Moments
            </h1>
            <p className="mt-5 text-gray-300 text-base md:text-lg leading-relaxed">
              A snapshot collection from previous editions. Add your photos by updating the photo list in this page and placing files in
              <span className="text-secondary font-semibold"> public/gallery</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAST_EVENT_PHOTOS.map((photo, index) => (
              <article
                key={`${photo.title}-${index}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 backdrop-blur-sm"
              >
                <img
                  src={photo.src}
                  alt={`${photo.title} - ${photo.event}`}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-white text-lg font-bold">{photo.title}</p>
                  <p className="text-gray-200 text-sm">{photo.event}</p>
                  <p className="text-secondary text-xs font-semibold uppercase tracking-wider mt-1">{photo.year}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl border border-primary/30 bg-primary/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white font-bold text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-secondary" />
                  Want to add more photos?
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  Upload files to <span className="text-secondary font-semibold">public/gallery</span> and add entries in
                  <span className="text-secondary font-semibold"> pages/Gallery.tsx</span>.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-white hover:text-primary text-white font-bold rounded-lg transition-colors"
              >
                Register For Ranatantra
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gallery;
