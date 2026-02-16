import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
gsap.registerPlugin(Observer)

window.addEventListener("DOMContentLoaded", () => {

    const container = document.querySelector('.infinite-scroll-container .container');

    let halfX, halfY;

    // Function to update dimensions (responsive support)
    const updateDimensions = () => {
        const content = document.querySelector('.infinite-scroll-container .content'); // Target the first content block
        if (content) {
            halfX = content.offsetWidth; // Use exact rendered width of one block
            halfY = content.offsetHeight; // Use exact rendered height of one block
        }
    };

    // Initial calculation
    updateDimensions();

    // Recalculate on resize
    window.addEventListener('resize', updateDimensions);

    const xTo = gsap.quickTo(container, 'x', {
        duration: 1.5,
        ease: "power4",
        modifiers: {
            x: (x) => gsap.utils.unitize(gsap.utils.wrap(-halfX, 0))(x) // Dynamic wrapping
        }
    });

    const yTo = gsap.quickTo(container, 'y', {
        duration: 1.5,
        ease: "power4",
        modifiers: {
            y: (y) => gsap.utils.unitize(gsap.utils.wrap(-halfY, 0))(y) // Dynamic wrapping
        }
    });

    let incrX = 0, incrY = 0;

    // Observer to handle wheel and drag events
    Observer.create({
        target: window,
        type: "wheel,touch,pointer", // Handles wheel, touch, and drag
        onChangeX: (self) => {
            if (self.event.type === "wheel")
                incrX -= self.deltaX
            else
                incrX += self.deltaX * 2

            xTo(incrX)
        },
        onChangeY: (self) => {
            if (self.event.type === "wheel")
                incrY -= self.deltaY
            else
                incrY += self.deltaY * 2

            yTo(incrY)
        }
    })
})