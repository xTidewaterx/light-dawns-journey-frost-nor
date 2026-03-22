import Image from "next/image";

export default function HeroBanner() {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden py-6 my-8">
      {/* Background image */}
      <Image

       // src="https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/images%2Fmountain%20blue.jpg?alt=media&token=dd43f78b-0f1a-4193-bab4-8ed6862eb314"
       src='https://pmstudio.com/pmstudio/images/Nina-Nesbitt51.jpg' 
       alt="Ocean Traveller Banner"
        fill
        priority
        quality={70}
        sizes="100vw"
        style={{ objectFit: "cover" }}
        className="absolute inset-0 z-10"
      />

      {/* Filter overlay with separate class */}
      {/*<div className="filter-overlay"></div>*/}
      
<div className=""></div>
      {/* Text layer unaffected by filter */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <h2 className="text-white p-12 text-8xl mb-0 text-center">
          Nora Lyvia
        </h2>
      </div>
    </div>
  );
}