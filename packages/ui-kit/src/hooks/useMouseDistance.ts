import { RefObject, useEffect } from "react";


export const useMouseDistance = (containerRef:RefObject<HTMLElement | null>, 
  
  distanceTop:number,
  distanceRight:number,
  distanceBottom:number,
  distanceLeft:number,
   callback:()=>void) => {
    useEffect(() => {
      const container = containerRef.current;
  
      if (!container) return;
  
      const handleMouseMove = (event:MouseEvent) => {
        const rect = container.getBoundingClientRect();

  
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        //top
        const topY = (rect.top - mouseY) > distanceTop
        // boottom
        const boottomY = (mouseY - (rect.top + rect.height)) > distanceBottom
        //left
        const leftX = (rect.left - mouseX) > distanceLeft
        //right
        const rightX = (mouseX - (rect.left + rect.width)) > distanceRight;
      
        if ([topY,boottomY,leftX,rightX].some(Boolean)) {
          callback();
        }
      };
  
      window.addEventListener('mousemove', handleMouseMove);
  
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, [containerRef,distanceTop,distanceRight, distanceLeft,distanceBottom, callback]);
  };