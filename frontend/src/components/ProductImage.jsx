
import React, { useEffect, useState } from "react";

const API =
  "https://world.openbeautyfacts.org/cgi/search.pl";

const FALLBACK =
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&auto=format&fit=crop&q=80";

const memoryCache = new Map();

export default function ProductImage({
  name,
  className = "shop-product-image",
}) {
  const [image, setImage] = useState(
    memoryCache.get(name)?.image || ""
  );

  useEffect(() => {
    let cancelled = false;

    async function searchImage() {
      if (!name?.trim()) {
        setImage(FALLBACK);
        return;
      }

      const key = name.trim().toLowerCase();

      if (memoryCache.has(key)) {
        setImage(memoryCache.get(key).image);
        return;
      }

      try {
        const cached = localStorage.getItem(
          "product-image:" + key
        );

        if (cached) {
          const result = JSON.parse(cached);
          memoryCache.set(key, result);

          if (!cancelled) {
            setImage(result.image || FALLBACK);
          }
          return;
        }

        const params = new URLSearchParams({
          search_terms: name,
          search_simple: "1",
          action: "process",
          json: "1",
          page_size: "10",
          fields:
            "product_name,brands,image_front_url,image_front_small_url",
        });

        const response = await fetch(`${API}?${params}`);

        if (!response.ok) {
          throw new Error("Product image search failed");
        }

        const data = await response.json();
        const products = data.products || [];

        const normalize = (value) =>
          String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const target = normalize(name);

        // Prefer a product-name match over an unrelated result.
        const match =
          products.find(
            (item) => normalize(item.product_name) === target
          ) ||
          products.find((item) => {
            const found = normalize(item.product_name);
            return (
              found.length > 5 &&
              (found.includes(target) || target.includes(found)) &&
              (item.image_front_url ||
                item.image_front_small_url)
            );
          });

        const result = {
          image:
            match?.image_front_url ||
            match?.image_front_small_url ||
            "",
          matchedName: match?.product_name || "",
        };

        memoryCache.set(key, result);

        try {
          localStorage.setItem(
            "product-image:" + key,
            JSON.stringify(result)
          );
        } catch {}

        if (!cancelled) {
          setImage(result.image || FALLBACK);
        }
      } catch (error) {
        console.warn("Image lookup failed:", name, error);

        if (!cancelled) {
          setImage(FALLBACK);
        }
      }
    }

    searchImage();

    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <img
      src={image || FALLBACK}
      alt={name}
      className={className}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = FALLBACK;
      }}
    />
  );
}
