#!/bin/bash

echo "Must use sudo for updating /etc"
sudo cp ./nvp-gg.conf /etc/apache2/sites-available/nvp-gg.conf

# Enables proxy passing
sudo a2enmod proxy_http

# Enables our site that we copied into sites-available
# (otherwise it just sits there)
# Also, this command copies the file from above to sites-enabled
sudo a2ensite nvp-gg
# If the default one is enabled, un-enable it
sudo a2dissite 000-default

# Gotta tell apache to-check configs
sudo systemctl daemon-reload
sudo systemctl reload apache2

echo "View the logs with 'systtemctl status apache2.service'"
