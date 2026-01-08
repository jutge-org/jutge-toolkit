#!/usr/bin/python
# -*- coding: latin1 -*-


import os

for a in range(-2, 2):
    for b in range(-2, 2):
        os.system("echo %i %i > prova_%i_%i.ent" % (a, b, a, b))
