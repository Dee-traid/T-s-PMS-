<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Users extends AbstractMigration
{
   
   
    public function change(): void
    {
         
        $table = $this->table('users', ['id' => false, 'primary_key' => 'id']);
        $table->addColumn('id', 'string', ['limit' => 100])
              ->addColumn('full_name', 'string', ['limit' => 220])
              ->addColumn('email', 'string', ['limit' => 150])
              ->addColumn('password', 'string', ['limit' => 255])
              ->addColumn('role', 'string', ['limit' => 50, 'default' => 'user'])
              ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addIndex(['email'], ['unique' => true])
              ->create();

                

    }
}
