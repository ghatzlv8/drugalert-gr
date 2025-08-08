#!/bin/bash

# Rescue mode fix script for Hetzner server
# This script helps fix common issues when booted in rescue mode

echo "=== Hetzner Rescue Mode Recovery Script ==="
echo "This script will help you mount your system and fix issues"
echo ""

# First, let's see what disks are available
echo "1. Checking available disks:"
lsblk

echo ""
echo "2. Mounting the root filesystem (usually /dev/sda1 or /dev/vda1):"
# Create mount point
mkdir -p /mnt/system

# Try to mount the main partition (adjust if needed)
mount /dev/sda1 /mnt/system 2>/dev/null || mount /dev/vda1 /mnt/system 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Root filesystem mounted successfully"
else
    echo "✗ Failed to mount. Please check 'lsblk' output and mount manually:"
    echo "  mount /dev/YOUR_DEVICE /mnt/system"
    exit 1
fi

# Mount necessary filesystems
echo ""
echo "3. Mounting necessary filesystems:"
mount --bind /dev /mnt/system/dev
mount --bind /proc /mnt/system/proc
mount --bind /sys /mnt/system/sys

# Chroot into the system
echo ""
echo "4. To enter your system and fix issues, run:"
echo "   chroot /mnt/system"
echo ""
echo "Once inside, you can:"
echo "  - Fix firewall: ufw disable"
echo "  - Restart services: systemctl restart drugalert-backend nginx"
echo "  - Check logs: journalctl -u drugalert-backend -n 50"
echo "  - Fix SSH: systemctl restart ssh"
echo ""
echo "To exit chroot: type 'exit'"
echo "To reboot: type 'reboot' (after exiting chroot)"
