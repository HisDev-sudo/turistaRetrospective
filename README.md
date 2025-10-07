# 🏢 Monopoly Corporativo

Un juego multijugador online basado en Monopoly con temática de oficina tecnológica.

## 🚀 Características

- **Multijugador**: Hasta 5 jugadores por sala
- **Salas privadas**: Códigos únicos de 6 caracteres
- **Tiempo real**: Comunicación instantánea con WebSockets
- **28 casillas**: Tablero completo con departamentos corporativos
- **3 tipos de cartas**: Retrospectiva, Chuscas y Dinámicas
- **Mecánicas avanzadas**: Sites con renta especial, detención, cafecito
- **Responsive**: Funciona en desktop y móvil

## 🎮 Cómo Jugar

1. **Crear/Unirse a Sala**
   - Ingresa tu nombre
   - Crea una sala nueva o únete con un código
   - Espera a que se unan más jugadores (mínimo 2)

2. **Mecánicas del Juego**
   - Dinero inicial: $15,000 por jugador
   - Lanza los dados en tu turno
   - Compra propiedades disponibles
   - Paga renta cuando caigas en propiedades ajenas
   - Cartas de Retrospectiva, Chuscas y Dinámicas
   - Recibe $3,000 al pasar por "Inicio"

3. **Casillas Especiales**
   - **Inicio**: Recibe $3,000
   - **Cafecito ☕**: Gana $500
   - **Detención**: Pierdes 1 turno
   - **Sites**: Renta especial (500 × dado × sites)

4. **Tipos de Propiedades**
   - **Ligeras**: $2,000 (renta $300)
   - **Medias**: $3,000-4,000 (renta $600-800)
   - **Pesadas**: $5,000 (renta $1,000)
   - **Sites**: $6,000 (renta especial)

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start

# Desarrollo con auto-reload
npm run dev
```

## 🌐 Uso

1. Abre tu navegador en `http://localhost:3000`
2. Ingresa tu nombre
3. Crea una sala o únete con un código
4. ¡Disfruta el juego!

## 🏗️ Tecnologías

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Comunicación**: WebSockets en tiempo real
- **Almacenamiento**: En memoria (fácil de migrar a Redis/MongoDB)

## 📱 Características Técnicas

- Responsive design
- Manejo de desconexiones
- Validación de turnos
- Sistema de salas robusto
- Interfaz intuitiva

## 🎯 Próximas Mejoras

- [ ] Persistencia de datos
- [ ] Más cartas de Email
- [ ] Efectos de sonido
- [ ] Animaciones de dados
- [ ] Chat en tiempo real
- [ ] Estadísticas de partidas

¡Domina el mundo empresarial! 🚀