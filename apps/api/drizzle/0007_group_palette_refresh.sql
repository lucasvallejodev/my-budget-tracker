UPDATE "category_groups"
SET "color" = CASE lower("color")
    WHEN '#9a7442' THEN '#DC6803'
    WHEN '#3e5c8a' THEN '#465FFF'
    WHEN '#3d7480' THEN '#0086C9'
    WHEN '#3f6e5a' THEN '#039855'
    WHEN '#4d6b3c' THEN '#4CA30D'
    WHEN '#9c5f3c' THEN '#EC4A0A'
    WHEN '#94586f' THEN '#DD2590'
    WHEN '#6e5a8a' THEN '#7A5AF8'
    WHEN '#8e3b3b' THEN '#D92D20'
    WHEN '#9a4b5a' THEN '#E31B54'
    WHEN '#4a5568' THEN '#475467'
    WHEN '#6b7585' THEN '#667085'
    WHEN '#7a7268' THEN '#79716B'
    WHEN '#2f6662' THEN '#0E9384'
    WHEN '#5b5488' THEN '#6938EF'
    WHEN '#857436' THEN '#A15C07'
  END
WHERE lower("color") IN ('#9a7442', '#3e5c8a', '#3d7480', '#3f6e5a', '#4d6b3c', '#9c5f3c', '#94586f', '#6e5a8a', '#8e3b3b', '#9a4b5a', '#4a5568', '#6b7585', '#7a7268', '#2f6662', '#5b5488', '#857436');
--> statement-breakpoint
UPDATE "accounts"
SET "color" = CASE lower("color")
    WHEN '#9a7442' THEN '#DC6803'
    WHEN '#3e5c8a' THEN '#465FFF'
    WHEN '#3d7480' THEN '#0086C9'
    WHEN '#3f6e5a' THEN '#039855'
    WHEN '#4d6b3c' THEN '#4CA30D'
    WHEN '#9c5f3c' THEN '#EC4A0A'
    WHEN '#94586f' THEN '#DD2590'
    WHEN '#6e5a8a' THEN '#7A5AF8'
    WHEN '#8e3b3b' THEN '#D92D20'
    WHEN '#9a4b5a' THEN '#E31B54'
    WHEN '#4a5568' THEN '#475467'
    WHEN '#6b7585' THEN '#667085'
    WHEN '#7a7268' THEN '#79716B'
    WHEN '#2f6662' THEN '#0E9384'
    WHEN '#5b5488' THEN '#6938EF'
    WHEN '#857436' THEN '#A15C07'
  END
WHERE lower("color") IN ('#9a7442', '#3e5c8a', '#3d7480', '#3f6e5a', '#4d6b3c', '#9c5f3c', '#94586f', '#6e5a8a', '#8e3b3b', '#9a4b5a', '#4a5568', '#6b7585', '#7a7268', '#2f6662', '#5b5488', '#857436');
--> statement-breakpoint
UPDATE "payees"
SET "color" = CASE lower("color")
    WHEN '#9a7442' THEN '#DC6803'
    WHEN '#3e5c8a' THEN '#465FFF'
    WHEN '#3d7480' THEN '#0086C9'
    WHEN '#3f6e5a' THEN '#039855'
    WHEN '#4d6b3c' THEN '#4CA30D'
    WHEN '#9c5f3c' THEN '#EC4A0A'
    WHEN '#94586f' THEN '#DD2590'
    WHEN '#6e5a8a' THEN '#7A5AF8'
    WHEN '#8e3b3b' THEN '#D92D20'
    WHEN '#9a4b5a' THEN '#E31B54'
    WHEN '#4a5568' THEN '#475467'
    WHEN '#6b7585' THEN '#667085'
    WHEN '#7a7268' THEN '#79716B'
    WHEN '#2f6662' THEN '#0E9384'
    WHEN '#5b5488' THEN '#6938EF'
    WHEN '#857436' THEN '#A15C07'
  END
WHERE lower("color") IN ('#9a7442', '#3e5c8a', '#3d7480', '#3f6e5a', '#4d6b3c', '#9c5f3c', '#94586f', '#6e5a8a', '#8e3b3b', '#9a4b5a', '#4a5568', '#6b7585', '#7a7268', '#2f6662', '#5b5488', '#857436');
