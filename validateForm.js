/* Copyright (C) 2024 Rodrigo Costa (roodrigoc@hotmail.com)

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; either version 3, or (at your option) any
later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; see the file COPYING. If not, see
<http://www.gnu.org/licenses/>.  */

function validateForm() {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const username = document.getElementById("username").value;
    const currentPassword = document.getElementById("currentPassword").value;
    let errorMessage = "";

    if (newPassword.length < 6) {
        errorMessage += "New password must be at least 6 characters long.\n";
    }
    if (newPassword === username) {
        errorMessage += "New password cannot be the same as the username.\n";
    }
    if (newPassword === currentPassword) {
        errorMessage += "New password cannot be the same as the current password.\n";
    }
    if (newPassword !== confirmPassword) {
        errorMessage += "New password and confirm password do not match.\n";
    }

    if (errorMessage !== "") {
        alert(errorMessage);
        return false;
    }
    
    return true;
}
    