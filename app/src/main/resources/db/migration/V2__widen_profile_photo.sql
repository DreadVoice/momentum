-- Profile photos are stored as URLs; 255 is too short for signed/CDN links.
ALTER TABLE users MODIFY profile_photo VARCHAR(512) NULL;
