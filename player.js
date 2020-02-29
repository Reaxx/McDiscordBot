class Player { 
    constructor(name,FirstLogIn = new Date()) {
        this.Name = name;
        this.FirstLogin = FirstLogIn;
        this.LogIn(FirstLogIn);
    }

    LogIn(time = new Date()) {
        this.LastLogin = time;
        this.IsLoggedIn = true;
    }

    LogOut(time = new Date()) {
        this.IsLoggedIn = false;
        this.LastLogout = time;
    }

    MinutesLogedIn(time = new Date()) {
        let diff = (time.getTime() - this.LastLogin.getTime()) / 60000;
        return Math.round(diff);
    }
    
    MinutesSinceLastLogin(time = new Date()) {
        let diff = (time.getTime() - this.LastLogout.getTime()) / 60000;
        return Math.round(diff);
    }

    toString() {
        return this.Name + " (" + this.MinutesLogedIn() +")";
    }
}

module.exports = Player