<?php $title = 'Not allowed'; ?>
<h1>Not allowed</h1>
<p>Your role (<?= e(human_enum($user['role'])) ?>) does not have access to this page. Ask an administrator if you need it.</p>
<a class="btn btn-ghost" href="<?= e(base_url('admin')) ?>">← Dashboard</a>
