const presets = {
  wrong: ["admin", "wrong"],
  attack: ["admin' -- ", "wrong"],
  valid: ["admin", "Admin@123"],
};
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const [username, password] = presets[button.dataset.preset];
    document.getElementById("username").value = username;
    document.getElementById("password").value = password;
    document.getElementById("username").focus();
  });
});
