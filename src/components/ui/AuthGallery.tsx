import React from 'react';
import { motion } from 'framer-motion';

const IMAGES = [
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80',
];

const duplicatedImages = [...IMAGES, ...IMAGES];

export const AuthGallery: React.FC = () => {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden opacity-30 pointer-events-none">
      <div className="absolute inset-0 bg-black/40 z-10" />
      
      {/* Row 1 */}
      <div className="absolute top-[10%] left-0 w-full h-[30%] -rotate-6 scale-125">
        <motion.div
          className="flex gap-4 items-center h-full"
          animate={{ x: ["0%", "-100%"] }}
          transition={{ ease: "linear", duration: 50, repeat: Infinity }}
        >
          {duplicatedImages.map((src, index) => (
            <div key={`row1-${index}`} className="relative aspect-[4/3] h-full flex-shrink-0">
              <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Row 2 */}
      <div className="absolute top-[50%] left-0 w-full h-[30%] -rotate-6 scale-125">
        <motion.div
          className="flex gap-4 items-center h-full"
          animate={{ x: ["-100%", "0%"] }}
          transition={{ ease: "linear", duration: 60, repeat: Infinity }}
        >
          {duplicatedImages.map((src, index) => (
            <div key={`row2-${index}`} className="relative aspect-[4/3] h-full flex-shrink-0">
              <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
