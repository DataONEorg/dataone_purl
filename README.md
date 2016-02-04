# dataone_purl
PURL configurations for DataONE

This repository contains Apache rewrite rules that implement redirects from purl.dataone.org to various targets.

## Updating Service

After editing rules in conf:

1. ssh to purl.dataone.org 
2. cd /usr/local/dataone
3. git pull https://github.com/DataONEorg/dataone_purl.git
4. sudo service apache2 reload

## Generally

Entries in conf/*.conf are loaded by the apache virtualhost using an IncludeOptional option.

Anything in www appears in the HTTP server root.

Update the HTML as new rules are added to the configuration, it keeps people happy.
