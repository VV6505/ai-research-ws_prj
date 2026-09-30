"use client";

import { useEffect, useState } from "react";

export function useViewportHeight() {
    const [height, setHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        function update() {
            const vh = window.visualViewport?.height ?? window.innerHeight;
            setHeight(vh);
        }

        update();
        window.visualViewport?.addEventListener("resize", update);
        window.addEventListener("resize", update);

        return () => {
            window.visualViewport?.removeEventListener("resize", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    return height;
}