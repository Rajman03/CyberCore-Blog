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
        password: Joi.string().min(8).required()
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
};

const postSchemas = {
    create: Joi.object({
        title: Joi.string().min(5).max(100).required(),
        content: Joi.string().min(10).max(5000).required()
    })
};

const commentSchemas = {
    create: Joi.object({
        post_id: Joi.string().required(),
        content: Joi.string().min(1).max(500).required()
    })
};

module.exports = {
    validate,
    authSchemas,
    postSchemas,
    commentSchemas
};
