module.exports = {
  apps : [{
    name: "ИМЯ_ПРООЦЕССА",                                 // todo-chat
    script: "./index.js",
    env_production: { 
      NODE_ENV: "production",
      JWT_SECRET: "ТВОЙ_СНЕНЕРИРОВАННЫЙ_JWT_СЕКРЕТ",       // 54j4jk5435v87fn98t7n983v43trv43tv6t5534...
      TURN_SECRET: "ТВОЙ_TURN_СЕКРЕТ",                     // uy978nc984237b48cn...
      TURN_URL: "turn:ТВОЙ_IP_VPS:3478"                    // 11.111.111.11    
    }
  }]
}