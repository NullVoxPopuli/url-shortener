#!/bin/bash

echo -e "\nMust use sudo for updating /etc\n"

config_from_git="$(dirname "${BASH_SOURCE[0]}")/nvp-local.conf"
sudo cp $config_from_git /etc/apache2/sites-available/nvp-local.conf

# Enables proxy passing
sudo a2enmod proxy_http

# Enables ssl
sudo a2enmod ssl

# Enables our site that we copied into sites-available
# (otherwise it just sits there)
# Also, this command copies the file from above to sites-enabled
sudo a2ensite nvp-local

# If the default one is enabled, un-enable it
sudo a2dissite 000-default
sudo a2dissite default-ssl

# Gotta tell apache to-check configs
sudo systemctl daemon-reload
sudo systemctl reload apache2

echo -e "\nView the logs with 'systtemctl status apache2.service'\n"


setup_hosts="$(dirname "${BASH_SOURCE[0]}")/../hosts.sh"

source $setup_hosts

