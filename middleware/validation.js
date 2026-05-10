const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

const authSchemas = {
    register: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')).required()
            .messages({
                'string.pattern.base': 'Hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę i jedną cyfrę.'
            })
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
};

const postSchemas = {
    create: Joi.object({
        title: Joi.string().min(5).max(100).required(),
        content: Joi.string().min(10).max(5000).required(),
        is_premium: Joi.boolean().optional()
    })
};

const commentSchemas = {
    create: Joi.object({
        post_id: Joi.number().integer().required(),
        content: Joi.string().min(1).max(500).required()
    })
};

const profileSchemas = {
    update: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        email: Joi.string().email().required()
    }),
    password: Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')).required()
            .messages({
                'string.pattern.base': 'Hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę i jedną cyfrę.'
            })
    })
};

module.exports = {
    validate,
    authSchemas,
    postSchemas,
    commentSchemas,
    profileSchemas
};
