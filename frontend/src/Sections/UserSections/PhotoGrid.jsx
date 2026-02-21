import React, { useState, useEffect, useRef } from 'react';
import Farming1 from '../../assets/Farming1.jpg';
import Farming2 from '../../assets/Farming2.jpg';
import Farming3 from '../../assets/Farming 3.jpg';
import Farming4 from '../../assets/Farming4.jpg';
import Farming5 from '../../assets/Farming5.jpg';
import Farming6 from '../../assets/Farming6.jpg';
import Farming7 from '../../assets/Farming7.jpg';
import Farming8 from '../../assets/Farming8.jpg';
import Farming9 from '../../assets/Farming9.jpg';
import Farming10 from '../../assets/Farming10.jpg';

const allPhotos = [
  { src: Farming1, title: 'Modern Farming' },
  { src: Farming2, title: 'Innovation' },
  { src: Farming3, title: 'Sustainability' },
  { src: Farming4, title: 'Technology' },
  { src: Farming5, title: 'Growth' },
  { src: Farming6, title: 'Excellence' },
  { src: Farming7, title: 'Harvest' },
  { src: Farming8, title: 'Community' },
  { src: Farming9, title: 'Future' },
  { src: Farming10, title: 'Nature' },
];

// Fixed span per grid position — bento layout (4 cols × 4 rows)
const spans = [
  'col-span-2 row-span-2', // 0: big
  'col-span-1 row-span-1', // 1
  'col-span-1 row-span-1', // 2
  'col-span-1 row-span-1', // 3
  'col-span-1 row-span-1', // 4
  'col-span-1 row-span-1', // 5
  'col-span-2 row-span-1', // 6: wide
  'col-span-1 row-span-1', // 7
  'col-span-2 row-span-1', // 8: wide
  'col-span-2 row-span-1', // 9: wide
];

const PhotoGrid = () => {
  // --- Desktop bento state ---
  const [order, setOrder] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const orderRef = useRef([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [incoming, setIncoming] = useState({});
  const [fadingIn, setFadingIn] = useState(new Set());

  // --- Mobile slider state ---
  const [slideIndex, setSlideIndex] = useState(0);

  // Desktop bento swap effect
  useEffect(() => {
    const interval = setInterval(() => {
      const positions = [];
      while (positions.length < 4) {
        const p = Math.floor(Math.random() * 10);
        if (!positions.includes(p)) positions.push(p);
      }
      const [posA, posB, posC, posD] = positions;
      const cur = orderRef.current;
      const incomingMap = {
        [posA]: cur[posB], [posB]: cur[posA],
        [posC]: cur[posD], [posD]: cur[posC],
      };
      setIncoming(incomingMap);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFadingIn(new Set([posA, posB, posC, posD]));
        });
      });
      setTimeout(() => {
        const next = [...orderRef.current];
        [next[posA], next[posB]] = [next[posB], next[posA]];
        [next[posC], next[posD]] = [next[posD], next[posC]];
        orderRef.current = next;
        setOrder(next);
        setIncoming({});
        setFadingIn(new Set());
      }, 700);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Mobile auto-slide effect
  useEffect(() => {
    const slider = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % allPhotos.length);
    }, 3000);
    return () => clearInterval(slider);
  }, []);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 pt-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 font-['Sora']">
            Empowering Farmers
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-['Sora']">
            Real stories from our community
          </p>
        </div>

        {/* Mobile Slider — visible only below md */}
        <div className="block md:hidden">
          <div className="relative w-full aspect-4/3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {allPhotos.map((photo, i) => (
              <img
                key={i}
                src={photo.src}
                alt={photo.title}
                style={{ transition: 'opacity 0.6s ease' }}
                className={`absolute inset-0 w-full h-full object-cover ${i === slideIndex ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/50 to-transparent">
              <p className="text-sm font-medium text-white font-['Sora']">
                {allPhotos[slideIndex].title}
              </p>
            </div>
          </div>
          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-3">
            {allPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === slideIndex ? 'bg-slate-900 dark:bg-white w-4' : 'bg-slate-300 dark:bg-slate-600'}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Bento Grid — visible only at md+ */}
        <div className="hidden md:grid grid-cols-4 gap-3" style={{ gridTemplateRows: 'repeat(4, 140px)' }}>
          {order.map((photoIndex, gridPos) => {
            const photo = allPhotos[photoIndex];
            const incomingIndex = incoming[gridPos];
            const hasIncoming = incomingIndex !== undefined;
            const isVisible = fadingIn.has(gridPos);
            return (
              <div
                key={gridPos}
                className={`group relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 ${spans[gridPos]}`}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                {hasIncoming && (
                  <img
                    src={allPhotos[incomingIndex].src}
                    alt={allPhotos[incomingIndex].title}
                    style={{ transition: 'opacity 0.65s ease' }}
                    className={`absolute inset-0 w-full h-full object-cover ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                  />
                )}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300" />
                <div className="absolute bottom-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-medium text-white font-['Sora']">{photo.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PhotoGrid;