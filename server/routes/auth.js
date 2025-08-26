const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Conectar ao banco de dados
database.connect().catch(console.error);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco
    const user = await database.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = generateToken(user);

    // Retornar dados do usuário (sem a senha) e token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login realizado com sucesso',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register (opcional - para criar novos usuários)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validação básica
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se usuário já existe
    const existingUser = await database.get('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUser) {
      return res.status(409).json({ error: 'Usuário já existe com este email' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir novo usuário
    const result = await database.run(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name]
    );

    // Buscar usuário criado
    const newUser = await database.get('SELECT id, email, name, role FROM users WHERE id = ?', [result.id]);

    // Gerar token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: newUser,
      token
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me - Verificar token e retornar dados do usuário
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Em uma implementação mais robusta, você poderia adicionar o token a uma blacklist
    // Por simplicidade, apenas retornamos sucesso
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
