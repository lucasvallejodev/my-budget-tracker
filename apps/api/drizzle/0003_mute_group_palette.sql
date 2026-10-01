SET LOCAL lock_timeout = '5s';--> statement-breakpoint
UPDATE "category_groups" AS "group"
SET "color" = "palette"."muted", "updated_at" = now()
FROM (
  VALUES
    ('#d97706', '#9A7442'),
    ('#2563eb', '#3E5C8A'),
    ('#0891b2', '#3D7480'),
    ('#059669', '#3F6E5A'),
    ('#16a34a', '#4D6B3C'),
    ('#ea580c', '#9C5F3C'),
    ('#db2777', '#94586F'),
    ('#9333ea', '#6E5A8A'),
    ('#dc2626', '#8E3B3B'),
    ('#e11d48', '#9A4B5A'),
    ('#475569', '#4A5568'),
    ('#64748b', '#6B7585'),
    ('#78716c', '#7A7268'),
    ('#0f766e', '#2F6662'),
    ('#7c3aed', '#5B5488'),
    ('#ca8a04', '#857436')
) AS "palette" ("bright", "muted")
WHERE lower("group"."color") = "palette"."bright";
