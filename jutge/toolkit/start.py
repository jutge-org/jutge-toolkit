#!/usr/bin/env python3
# coding=utf-8

"""
This script is used to start correcting a submission.
"""

import argparse
import logging
import os
import resource
import subprocess
import sys

from jutge import util


def main():
    """main"""

    util.init_logging()

    parser = argparse.ArgumentParser(
        description='Correct a submission')
    parser.add_argument('name')
    parser.add_argument(
        '--no-wrapping',
        action='store_true',
        help='do not wrap')
    args = parser.parse_args()

    wrapping = not args.no_wrapping

    logging.info('name: %s' % args.name)
    logging.info('wrapping: %s' % str(wrapping))

    if wrapping:
        logging.info('starting correction')
        logging.info('cwd=%s' % os.getcwd())
        logging.info('user=%s' % util.get_username())
        logging.info('host=%s' % util.get_hostname())

        logging.info('setting ulimits')
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_CPU, (300, 300))
        # resource.setrlimit(resource.RLIMIT_NPROC, (1000, 1000))

        logging.info('setting umask')
        os.umask(0o077)

        logging.info('decompressing submission')
        util.del_dir('submission')
        util.mkdir('submission')
        util.extract_tgz('submission.tgz', 'submission')

        logging.info('decompressing problem')
        util.del_dir('problem')
        util.mkdir('problem')
        util.extract_tgz('problem.tgz', 'problem')

        logging.info('decompressing driver')
        util.del_dir('driver')
        util.mkdir('driver')
        util.extract_tgz('driver.tgz', 'driver')

        logging.info('mkdir solution')
        util.del_dir('solution')
        util.mkdir('solution')

        logging.info('mkdir correction')
        util.del_dir('correction')
        util.mkdir('correction')


    # We need to execute the driver and, both for stdout and stderr, show them
    # on the screen and save them to a file.

    command = ["python3", "driver/judge.py", args.name]
    logging.info('executing %s' % ' '.join(command))

    process = subprocess.Popen(
        command,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        text = True,
        universal_newlines = True
    )

    stdout, stderr = process.communicate()

    print("STDOUT:", stdout)
    with open("stdout.txt", 'w') as stdout_file:
        stdout_file.write(stdout)

    print("STDERR:", stderr)
    with open("stderr.txt", 'w') as stderr_file:
        stderr_file.write(stderr)

    return_code = process.returncode

    logging.info('execution finished with return_code = %d' % return_code)

    os.rename("stderr.txt", "correction/stderr.txt")
    os.rename("stdout.txt", "correction/stdout.txt")
    os.system("chmod -R u+rwX,go-rwx .")

    logging.info('end of correction')

    if wrapping:
        logging.info('compressing correction')
        util.create_tgz('correction.tgz', '.', 'correction')

    logging.info('flushing and closing files')
    sys.stdout.flush()
    sys.stderr.flush()
    sys.stdout.close()
    sys.stderr.close()
    sys.stdin.close()
    # noinspection PyProtectedMember
    os._exit(0)


if __name__ == '__main__':
    main()
