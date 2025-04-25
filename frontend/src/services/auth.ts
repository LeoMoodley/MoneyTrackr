export const refreshToken = async () => {
    const refresh = localStorage.getItem("refresh_token");

    const response = await fetch("https://moneytrackrz.netlify.app/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access_token", data.access);
        return data.access;
    } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return null;
    }
};
