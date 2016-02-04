# dataone_purl
PURL configurations for DataONE

This repository contains Apache rewrite rules that implement redirects from purl.dataone.org to various targets.

## Installation

ssh to purl.dataone.org and checkout this repository into /usr/loca/dataone. The subfolder www is mapped to the server document root, and the subfolder conf is symlinked to /etc/dataone/purl. Any *.conf in the conf subfolder is included in the Apache config.

As new rules are added to the configuration, it is beneficial to others to ensure the index.html file is updated as well.
